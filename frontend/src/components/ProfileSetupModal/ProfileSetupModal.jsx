import { useState } from 'react';
import { profileService } from '../../services/supabase/profileService';
import './ProfileSetupModal.css';

export default function ProfileSetupModal({ user, onComplete }) {
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || '',
    username: '',
    date_of_birth: '',
    grade: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (!/^[a-z0-9_]{3,20}$/.test(form.username))
      e.username = '3–20 chars, lowercase letters, numbers, underscores only';
    if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'username' ? value.toLowerCase() : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError(null);
    try {
      const available = await profileService.isUsernameAvailable(form.username);
      if (!available) {
        setErrors({ username: 'This username is already taken' });
        setLoading(false);
        return;
      }
      const profile = await profileService.createProfile(user.id, form);
      onComplete(profile);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="psm-overlay">
      <div className="psm-card">
        <div className="psm-header">
          <div className="psm-avatar">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" />
            ) : (
              <span>{form.name?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <h2 className="psm-title">Complete Your Profile</h2>
          <p className="psm-subtitle">Just a few details to get you started</p>
        </div>

        <form className="psm-form" onSubmit={handleSubmit} noValidate>
          <div className={`psm-field ${errors.name ? 'psm-field--error' : ''}`}>
            <label className="psm-label" htmlFor="psm-name">Full Name <span>*</span></label>
            <input
              id="psm-name"
              className="psm-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Yash Sharma"
              autoFocus
            />
            {errors.name && <p className="psm-error">{errors.name}</p>}
          </div>

          <div className={`psm-field ${errors.username ? 'psm-field--error' : ''}`}>
            <label className="psm-label" htmlFor="psm-username">Username <span>*</span></label>
            <div className="psm-input-prefix">
              <span className="psm-prefix">@</span>
              <input
                id="psm-username"
                className="psm-input psm-input--prefixed"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="yash_sharma"
                maxLength={20}
              />
            </div>
            {errors.username && <p className="psm-error">{errors.username}</p>}
          </div>

          <div className={`psm-field ${errors.date_of_birth ? 'psm-field--error' : ''}`}>
            <label className="psm-label" htmlFor="psm-dob">Date of Birth <span>*</span></label>
            <input
              id="psm-dob"
              className="psm-input"
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date_of_birth && <p className="psm-error">{errors.date_of_birth}</p>}
          </div>

          <div className="psm-field">
            <label className="psm-label" htmlFor="psm-grade">
              Grade / Standard <span className="psm-optional">(optional)</span>
            </label>
            <select
              id="psm-grade"
              className="psm-input psm-select"
              name="grade"
              value={form.grade}
              onChange={handleChange}
            >
              <option value="">Select grade…</option>
              {['6', '7', '8', '9', '10', '11', '12'].map(g => (
                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
              ))}
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {serverError && <p className="psm-server-error">{serverError}</p>}

          <button className="psm-submit" type="submit" disabled={loading}>
            {loading ? <span className="psm-spinner" /> : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
