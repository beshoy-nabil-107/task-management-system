import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { Icons } from '../../assets/icons';
import { Button } from '../../components/UI';
import './Register.scss';

export function Register() {
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate, dispatch]);

  async function handleSubmit(event) {
    event.preventDefault();
    const name = nameRef.current?.value?.trim();
    const email = emailRef.current?.value?.trim();
    const password = passwordRef.current?.value;

    if (!name || !email || !password) return;

    const result = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="auth-page__header">
          <div className="auth-page__header-brand">
            <div className="auth-page__header-brand-icon">
              <Icons.Tasks size={18} strokeWidth={2.2} />
            </div>
            <span className="auth-page__header-brand-title">TaskFlow</span>
          </div>
          <h1>Create an account</h1>
          <p>Join your team and start managing tasks today</p>
        </div>

        {error && (
          <div className="auth-page__error" role="alert">
            <Icons.Alert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <div className="auth-page__form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              ref={nameRef}
              placeholder="e.g. Alex Johnson"
              required
              autoFocus
            />
          </div>

          <div className="auth-page__form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              ref={emailRef}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="auth-page__form-group">
            <label htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
              type="password"
              ref={passwordRef}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            fullWidth
          >
            Create account
          </Button>
        </form>

        <div className="auth-page__footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
