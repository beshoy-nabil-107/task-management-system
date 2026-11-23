import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExtensions,
  reviewExtensionThunk,
} from '../../store/slices/extensionSlice';
import { Button, Badge, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate } from '../../utils/formatters';
import './Extensions.scss';

export function Extensions() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: extensions, loading } = useSelector((state) => state.extensions);

  const role = user?.role || 'member';
  const [activeTab, setActiveTab] = useState('All');
  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchExtensions());
  }, [dispatch]);

  async function handleReview(id, status) {
    setActionLoading(true);
    setFeedback({ type: null, message: '' });

    const result = await dispatch(reviewExtensionThunk({ id, status }));
    setActionLoading(false);

    if (reviewExtensionThunk.fulfilled.match(result)) {
      setFeedback({
        type: 'success',
        message: `Extension request ${status.toLowerCase()} successfully. ${
          status === 'Approved' ? 'Task deadline has been extended.' : ''
        }`,
      });
      dispatch(fetchExtensions());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to review extension request.',
      });
    }
  }

  const filteredExtensions = extensions.filter((ext) => {
    if (activeTab === 'All') return true;
    return ext.status === activeTab;
  });

  return (
    <div className="extensions-page">
      <div className="extensions-page__header">
        <div>
          <h1>Deadline Extension Requests</h1>
          <p>
            {role === 'member'
              ? 'Track the status and review outcomes of your requested deadline extensions'
              : 'Review, evaluate, and approve deadline extension requests from squad members'}
          </p>
        </div>
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

      {/* Tabs */}
      <div className="extensions-page__tabs">
        {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="extensions-page__table-card">
        {loading ? (
          <Loader size="md" text="Loading extension requests..." />
        ) : filteredExtensions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Requested By</th>
                <th>Current Deadline</th>
                <th>Requested Deadline</th>
                <th>Reason</th>
                <th>Status</th>
                {(role === 'manager' || role === 'team_leader') && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredExtensions.map((ext) => (
                <tr key={ext.id}>
                  <td>
                    <Link to={`/tasks/${ext.task_id}`}>{ext.task_title}</Link>
                  </td>
                  <td className="font-medium text-secondary">{ext.requester_name}</td>
                  <td className="text-muted">{formatDate(ext.current_deadline)}</td>
                  <td className="font-semibold text-primary">
                    {formatDate(ext.requested_deadline)}
                  </td>
                  <td className="text-secondary" style={{ maxWidth: '240px' }}>
                    {ext.reason}
                  </td>
                  <td>
                    <Badge variant={ext.status}>{ext.status}</Badge>
                  </td>
                  {(role === 'manager' || role === 'team_leader') && (
                    <td style={{ textAlign: 'right' }}>
                      {ext.status === 'Pending' ? (
                        <div className="extensions-page__actions">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoading}
                            onClick={() => handleReview(ext.id, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={actionLoading}
                            onClick={() => handleReview(ext.id, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          Reviewed by {ext.reviewer_name || 'Leader'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Icons.Clock}
            title="No extension requests"
            subtitle={`There are no ${activeTab.toLowerCase()} extension requests.`}
          />
        )}
      </div>
    </div>
  );
}

export default Extensions;
