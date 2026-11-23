import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMilestones,
  createMilestoneThunk,
  updateMilestoneThunk,
  deleteMilestoneThunk,
} from '../../store/slices/milestoneSlice';
import { Button, Modal, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate, toInputDate } from '../../utils/formatters';
import './Milestones.scss';

export function Milestones() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: milestones, loading } = useSelector((state) => state.milestones);

  const role = user?.role || 'member';

  const [formModal, setFormModal] = useState({ isOpen: false, isEdit: false, milestone: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, milestone: null });
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    dispatch(fetchMilestones());
  }, [dispatch]);

  function handleOpenCreate() {
    setFormData({ title: '', description: '', due_date: '' });
    setFormModal({ isOpen: true, isEdit: false, milestone: null });
  }

  function handleOpenEdit(m) {
    setFormData({
      title: m.title,
      description: m.description || '',
      due_date: toInputDate(m.due_date),
    });
    setFormModal({ isOpen: true, isEdit: true, milestone: m });
  }

  async function handleSaveMilestone(e) {
    e.preventDefault();
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      due_date: formData.due_date || null,
    };

    let result;
    if (formModal.isEdit) {
      result = await dispatch(
        updateMilestoneThunk({ id: formModal.milestone.id, data: payload })
      );
    } else {
      result = await dispatch(createMilestoneThunk(payload));
    }

    if (
      createMilestoneThunk.fulfilled.match(result) ||
      updateMilestoneThunk.fulfilled.match(result)
    ) {
      setFeedback({
        type: 'success',
        message: `Milestone ${formModal.isEdit ? 'updated' : 'created'} successfully.`,
      });
      setFormModal({ isOpen: false, isEdit: false, milestone: null });
      dispatch(fetchMilestones());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to save milestone.',
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteModal.milestone) return;
    const result = await dispatch(deleteMilestoneThunk(deleteModal.milestone.id));
    if (deleteMilestoneThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'Milestone deleted successfully.' });
      setDeleteModal({ isOpen: false, milestone: null });
      dispatch(fetchMilestones());
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to delete milestone.' });
    }
  }

  return (
    <div className="milestones-page">
      <div className="milestones-page__header">
        <div>
          <h1>Project Milestones</h1>
          <p>Track high-level project goals, sprint targets, and milestone progress</p>
        </div>

        {role === 'manager' && (
          <Button variant="primary" icon={<Icons.Plus size={16} />} onClick={handleOpenCreate}>
            Create Milestone
          </Button>
        )}
      </div>

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

      {loading ? (
        <Loader size="md" text="Loading milestones..." />
      ) : milestones.length > 0 ? (
        <div className="milestones-page__grid">
          {milestones.map((m) => {
            const total = Number(m.total_tasks) || 0;
            const completed = Number(m.completed_tasks) || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={m.id} className="milestones-page__card">
                <div className="milestones-page__card-header">
                  <div>
                    <h3>{m.title}</h3>
                    <p>{m.description || 'No description provided.'}</p>
                  </div>
                  {role === 'manager' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Icons.Edit size={14} />}
                        onClick={() => handleOpenEdit(m)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Icons.Trash size={14} />}
                        onClick={() => setDeleteModal({ isOpen: true, milestone: m })}
                      />
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="milestones-page__card-progress">
                  <div className="milestones-page__card-progress-labels">
                    <span>Progress</span>
                    <span>
                      {completed} / {total} tasks ({progress}%)
                    </span>
                  </div>
                  <div className="milestones-page__card-progress-track">
                    <div
                      className="milestones-page__card-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="milestones-page__card-meta">
                  <span>Due {formatDate(m.due_date)}</span>
                  <span>Created by {m.creator_name || 'Admin'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Icons.Milestones}
          title="No milestones created"
          subtitle={
            role === 'manager'
              ? 'Define major target milestones to group project tasks.'
              : 'No project milestones have been scheduled yet.'
          }
          action={
            role === 'manager' ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                Create Milestone
              </Button>
            ) : null
          }
        />
      )}

      {/* Create / Edit Milestone Modal (Manager Only) */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, isEdit: false, milestone: null })}
        title={formModal.isEdit ? `Edit Milestone: ${formModal.milestone?.title}` : 'Create Milestone'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFormModal({ isOpen: false, isEdit: false, milestone: null })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMilestone}>
              {formModal.isEdit ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </>
        }
      >
        <form className="milestones-page__form" onSubmit={handleSaveMilestone}>
          <div className="milestones-page__form-group">
            <label htmlFor="milestone-title">Milestone Title</label>
            <input
              id="milestone-title"
              type="text"
              placeholder="e.g. Beta Release 1.0"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="milestones-page__form-group">
            <label htmlFor="milestone-desc">Description (optional)</label>
            <textarea
              id="milestone-desc"
              placeholder="Deliverables and milestones scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="milestones-page__form-group">
            <label htmlFor="milestone-due">Target Due Date (optional)</label>
            <input
              id="milestone-due"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Milestone Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, milestone: null })}
        title="Confirm Milestone Deletion"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, milestone: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Milestone
            </Button>
          </>
        }
      >
        <p style={{ color: '#52525B', fontSize: '13px', lineHeight: 1.5 }}>
          Are you sure you want to delete milestone{' '}
          <strong>{deleteModal.milestone?.title}</strong>? Associated tasks will have their
          milestone cleared.
        </p>
      </Modal>
    </div>
  );
}

export default Milestones;
