import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { Icons } from '../../assets/icons';
import { Button } from '../../components/UI';
import './Login.scss';

export function Login() {
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
    const email = emailRef.current?.value?.trim();
    const password = passwordRef.current?.value;

    if (!email || !password) return;

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
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
          <h1>Welcome back</h1>
          <p>Enter your credentials to access your workspace</p>
        </div>

        {error && (
          <div className="auth-page__error" role="alert">
            <Icons.Alert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <div className="auth-page__form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              ref={emailRef}
              placeholder="name@company.com"
              required
              autoFocus
            />
          </div>

          <div className="auth-page__form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              ref={passwordRef}
              placeholder="••••••••"
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
            Sign in
          </Button>
        </form>

        <div className="auth-page__footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
