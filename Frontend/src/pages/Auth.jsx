import { oktaLoginUrl } from "../api.js";

const ERROR_MESSAGES = {
  expired: "Your login session expired, please try again.",
  state_mismatch: "Login failed for security reasons, please try again.",
  domain_not_allowed: "This email address isn't allowed to access this app.",
  no_email: "Your Okta account doesn't have an email address, please contact an admin.",
};

const Auth = () => {
  const error = new URLSearchParams(location.search).get("auth_error");

  return (
    <div className="auth">
      <div className="auth-intro">
        <div className="brand big"><i />Hidden Talents</div>
        <p>Your skills don't stop at your job title. Let people know what you can do outside your contract: web design, gardening, languages, DIY…</p>
        <ul className="promises">
          <li>Your profile stays hidden until you make it visible.</li>
          <li>You can decline any mission proposal.</li>
          <li>You can delete your account at any time.</li>
        </ul>
      </div>
      <div className="panel">
        <h1>Log in</h1>
        <p className="hint">Sign in with your company Okta account.</p>
        {error && <p className="error" role="alert">{ERROR_MESSAGES[error] || "Login failed, please try again."}</p>}
        <a className="btn" href={oktaLoginUrl()}>Log in with Okta</a>
      </div>
    </div>
  );
};

export default Auth;
