import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTaskById,
  updateTaskStatusThunk,
  reviewTaskThunk,
  addAttachmentThunk,
} from '../../store/slices/taskSlice';
import { createExtensionThunk } from '../../store/slices/extensionSlice';
import taskService from '../../services/taskService';
import { Button, Badge, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import './TaskDetails.scss';

export function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { currentTask, detailLoading } = useSelector((state) => state.tasks);

  const fileInputRef = useRef(null);
  const noteInputRef = useRef(null);

  // Review Form state
  const [qualityRating, setQualityRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Extension Form state
  const [extensionDeadline, setExtensionDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionOpen, setExtensionOpen] = useState(false);

  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id));
    }
  }, [dispatch, id]);

  const task = currentTask?.task;
  const attachments = currentTask?.attachments || [];
  const extensions = currentTask?.extensions || [];

  const role = user?.role || 'member';
  const isAssigned = Number(task?.assigned_to) === Number(user?.id);
  const isLeader =
    role === 'team_leader' && Number(task?.team_id) === Number(user?.team_id);
  const isManager = role === 'manager';

  // Workflow actions
  async function handleStatusChange(newStatus) {
    setActionLoading(true);
    setFeedback({ type: null, message: '' });

    const result = await dispatch(updateTaskStatusThunk({ id: task.id, status: newStatus }));
    setActionLoading(false);

    if (updateTaskStatusThunk.fulfilled.match(result)) {
      setFeedback({
        type: 'success',
        message: `Task status updated to "${result.payload.status}".`,
      });
      dispatch(fetchTaskById(id));
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to update status.' });
    }
  }

  // Quality review action
  async function handleReviewSubmit(decision) {
    if (decision === 'reject' && !reviewFeedback.trim()) {
      setFeedback({ type: 'error', message: 'Review feedback is required when rejecting a task.' });
      return;
    }

    setActionLoading(true);
    setFeedback({ type: null, message: '' });

    const payload = {
      decision,
      quality_rating: decision === 'approve' ? Number(qualityRating) : null,
      review_feedback: reviewFeedback.trim() || null,
    };

    const result = await dispatch(reviewTaskThunk({ id: task.id, payload }));
    setActionLoading(false);

    if (reviewTaskThunk.fulfilled.match(result)) {
      setFeedback({
        type: 'success',
        message: `Task review submitted: ${decision === 'approve' ? 'Approved' : 'Rejected'}.`,
      });
      setReviewFeedback('');
      dispatch(fetchTaskById(id));
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to submit review.' });
    }
  }

  // Add note / file attachment
  async function handleAddAttachment(e) {
    e.preventDefault();
    const note = noteInputRef.current?.value?.trim();
    const file = fileInputRef.current?.files?.[0];

    if (!note && !file) {
      setFeedback({ type: 'error', message: 'Please provide either a note or a file.' });
      return;
    }

    const formData = new FormData();
    if (note) formData.append('note', note);
    if (file) formData.append('file', file);

    setActionLoading(true);
    const result = await dispatch(addAttachmentThunk({ taskId: task.id, formData }));
    setActionLoading(false);

    if (addAttachmentThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'Note/Attachment added successfully.' });
      if (noteInputRef.current) noteInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      dispatch(fetchTaskById(id));
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to add attachment.' });
    }
  }

  // File download
  async function handleDownload(attachment) {
    try {
      await taskService.downloadAttachment(task.id, attachment.id, attachment.file_name);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to download file attachment.' });
    }
  }

  // Submit deadline extension
  async function handleExtensionSubmit(e) {
    e.preventDefault();
    if (!extensionDeadline || !extensionReason.trim()) return;

    setActionLoading(true);
    const result = await dispatch(
      createExtensionThunk({
        task_id: task.id,
        requested_deadline: extensionDeadline,
        reason: extensionReason.trim(),
      })
    );
    setActionLoading(false);

    if (createExtensionThunk.fulfilled.match(result)) {
      setFeedback({
        type: 'success',
        message: 'Deadline extension request submitted to team leader.',
      });
      setExtensionDeadline('');
      setExtensionReason('');
      setExtensionOpen(false);
      dispatch(fetchTaskById(id));
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to request extension.' });
    }
  }

  if (detailLoading || !task) {
    return <Loader fullscreen text="Loading task details..." />;
  }

  return (
    <div className="task-details-page">
      {/* Back Button */}
      <div>
        <Link to="/tasks" className="task-details-page__back-btn">
          <Icons.ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to Tasks</span>
        </Link>
      </div>

      {/* Header */}
      <div className="task-details-page__header">
        <div className="task-details-page__header-left">
          <h1>{task.title}</h1>
          <div className="task-details-page__header-left-badges">
            <Badge variant={task.status}>{task.status}</Badge>
            <Badge variant={task.priority}>{task.priority} Priority</Badge>
            {task.milestone_title && <Badge variant="neutral">{task.milestone_title}</Badge>}
          </div>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback.message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#047857' : '#B91C1C',
            border: `1px solid ${feedback.type === 'success' ? '#D1FAE5' : '#FEE2E2'}`,
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: null, message: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="task-details-page__layout">
        {/* Left Column: Description, Review Result, Notes/Attachments */}
        <div className="task-details-page__main">
          {/* Description Card */}
          <div className="task-details-page__card">
            <h3>Description</h3>
            <p>{task.description || 'No detailed description provided for this task.'}</p>
          </div>

          {/* Quality Review Result Card (If reviewed) */}
          {(task.quality_rating || task.review_feedback) && (
            <div className="task-details-page__review-result">
              <div className="task-details-page__review-result-header">
                <span>Quality Assessment</span>
                {task.quality_rating && (
                  <div className="task-details-page__review-result-header-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icons.Star
                        key={star}
                        size={15}
                        fill={star <= task.quality_rating ? '#D97706' : 'none'}
                        stroke="#D97706"
                      />
                    ))}
                    <span style={{ marginLeft: '4px', fontWeight: 600, color: '#09090B' }}>
                      {task.quality_rating}/5
                    </span>
                  </div>
                )}
              </div>
              {task.review_feedback && (
                <div className="task-details-page__review-result-feedback">
                  {task.review_feedback}
                </div>
              )}
              <div className="task-details-page__review-result-meta">
                Reviewed by {task.reviewer_name || 'Leader'} on {formatDate(task.reviewed_at)}
              </div>
            </div>
          )}

          {/* Attachments & Notes Section */}
          <div className="task-details-page__card">
            <h3>Notes & Attachments</h3>

            {/* Upload & Note Form */}
            <form
              className="task-details-page__attachments-form"
              onSubmit={handleAddAttachment}
            >
              <textarea
                ref={noteInputRef}
                placeholder="Add work progress note or submission comments..."
                rows={2}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ fontSize: '12px', width: 'auto' }}
                  />
                  <small style={{ display: 'block', color: '#71717A', marginTop: '3px' }}>
                    Max file size: 5MB (stored securely in database)
                  </small>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  icon={<Icons.Upload size={14} />}
                >
                  Post Note / File
                </Button>
              </div>
            </form>

            {/* Attachments List */}
            <div className="task-details-page__attachments-list">
              {attachments.length > 0 ? (
                attachments.map((att) => (
                  <div key={att.id} className="task-details-page__attachment-item">
                    <div className="task-details-page__attachment-item-header">
                      <span>{att.author_name || 'Collaborator'}</span>
                      <span>{formatDateTime(att.created_at)}</span>
                    </div>

                    {att.note && (
                      <div className="task-details-page__attachment-item-note">{att.note}</div>
                    )}

                    {att.file_name && (
                      <div className="task-details-page__attachment-item-file">
                        <div className="task-details-page__attachment-item-file-name">
                          <Icons.FileText size={15} />
                          <span>
                            {att.file_name} ({formatFileSize(att.file_size)})
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Icons.Download size={13} />}
                          onClick={() => handleDownload(att)}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Icons.Upload}
                  title="No attachments yet"
                  subtitle="Share progress notes or upload project files above."
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Actions, Metadata, Extension Request */}
        <div className="task-details-page__sidebar">
          {/* Metadata Card */}
          <div className="task-details-page__card">
            <h3>Task Details</h3>
            <div className="task-details-page__meta-list">
              <div className="task-details-page__meta-item">
                <span className="task-details-page__meta-item-label">Deadline</span>
                <span className="task-details-page__meta-item-value">
                  {formatDate(task.deadline)}
                </span>
              </div>

              <div className="task-details-page__meta-item">
                <span className="task-details-page__meta-item-label">Assigned Squad</span>
                <span className="task-details-page__meta-item-value">
                  {task.team_name || 'Unassigned'}
                </span>
              </div>

              <div className="task-details-page__meta-item">
                <span className="task-details-page__meta-item-label">Assignee</span>
                <span className="task-details-page__meta-item-value">
                  {task.assigned_to ? (
                    `${task.assignee_name} (#${task.assigned_to})`
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </span>
              </div>

              <div className="task-details-page__meta-item">
                <span className="task-details-page__meta-item-label">Created By</span>
                <span className="task-details-page__meta-item-value">
                  {task.creator_name || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Member Workflow Actions Card */}
          {(isAssigned || isManager) && (
            <div className="task-details-page__card">
              <h3>Task Actions</h3>

              <div className="task-details-page__workflow-box">
                {task.status === 'Pending' && (
                  <Button
                    variant="primary"
                    fullWidth
                    loading={actionLoading}
                    icon={<Icons.Check size={16} />}
                    onClick={() => handleStatusChange('In Progress')}
                  >
                    Accept Task & Begin
                  </Button>
                )}

                {(task.status === 'In Progress' || task.status === 'Delayed') && (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      loading={actionLoading}
                      icon={<Icons.CheckSquare size={16} />}
                      onClick={() => handleStatusChange('PendingReview')}
                    >
                      Submit for Review
                    </Button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {task.status !== 'In Progress' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => handleStatusChange('In Progress')}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {task.status !== 'Delayed' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => handleStatusChange('Delayed')}
                        >
                          Mark Delayed
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {task.status === 'PendingReview' && (
                  <p style={{ fontSize: '13px', color: '#B45309', fontWeight: 500 }}>
                    Work submitted. Awaiting quality review from your team leader.
                  </p>
                )}

                {task.status === 'Completed' && (
                  <p style={{ fontSize: '13px', color: '#047857', fontWeight: 500 }}>
                    Task marked as completed.
                  </p>
                )}
              </div>

              {/* Request Deadline Extension Button for Assignee */}
              {isAssigned && (task.status === 'In Progress' || task.status === 'Delayed') && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #E4E4E7', paddingTop: '12px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={<Icons.Clock size={14} />}
                    onClick={() => setExtensionOpen(!extensionOpen)}
                  >
                    {extensionOpen ? 'Cancel Extension Request' : 'Request Deadline Extension'}
                  </Button>

                  {extensionOpen && (
                    <form
                      onSubmit={handleExtensionSubmit}
                      style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div>
                        <label style={{ fontSize: '12px' }}>Member ID & Name</label>
                        <input
                          type="text"
                          value={`#${user?.id} — ${user?.name}`}
                          disabled
                          style={{ fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px' }}>Requested New Deadline</label>
                        <input
                          type="date"
                          value={extensionDeadline}
                          onChange={(e) => setExtensionDeadline(e.target.value)}
                          required
                          style={{ fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px' }}>Justification Reason</label>
                        <textarea
                          placeholder="Reason for extension request..."
                          value={extensionReason}
                          onChange={(e) => setExtensionReason(e.target.value)}
                          required
                          rows={2}
                          style={{ fontSize: '12px' }}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        fullWidth
                        loading={actionLoading}
                      >
                        Send Extension Request
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quality Review Panel (Team Leader for own team, or Manager) */}
          {(isLeader || isManager) && task.status === 'PendingReview' && (
            <div className="task-details-page__card">
              <h3>Work Quality Review</h3>
              <p style={{ fontSize: '12px' }}>
                Rate work quality (1-5) and provide review feedback.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Quality Rating (1 to 5)</label>
                  <div className="task-details-page__rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={qualityRating === star ? 'active' : ''}
                        onClick={() => setQualityRating(star)}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px' }}>Review Feedback / Assessment</label>
                  <textarea
                    placeholder="Evaluation notes, feedback, or rework instructions..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    loading={actionLoading}
                    icon={<Icons.Check size={14} />}
                    onClick={() => handleReviewSubmit('approve')}
                  >
                    Approve Work
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    loading={actionLoading}
                    icon={<Icons.X size={14} />}
                    onClick={() => handleReviewSubmit('reject')}
                  >
                    Reject & Rework
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Extension Request History for This Task */}
          {extensions.length > 0 && (
            <div className="task-details-page__card">
              <h3>Extension Requests</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {extensions.map((ext) => (
                  <div
                    key={ext.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #E4E4E7',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Requested: {formatDate(ext.requested_deadline)}</span>
                      <Badge variant={ext.status}>{ext.status}</Badge>
                    </div>
                    <p style={{ color: '#52525B', fontSize: '12px' }}>{ext.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;
