import { oktaLoginUrl } from "../api.js";
import { useLang } from "../i18n.jsx";

const KNOWN_ERRORS = ["expired", "state_mismatch", "domain_not_allowed", "no_email"];

const Auth = () => {
  const { t, lang, setLang } = useLang();
  const code = new URLSearchParams(location.search).get("auth_error");
  const errorKey = KNOWN_ERRORS.includes(code) ? `auth.error.${code}` : code ? "auth.error.default" : null;

  return (
    <div className="auth">
      <div className="lang-switch auth-lang" role="group" aria-label="Language">
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
      </div>
      <div className="auth-intro">
        <div className="brand big"><i />Hidden Talents</div>
        <p>{t("auth.tagline")}</p>
        <ul className="promises">
          <li>{t("auth.promise1")}</li>
          <li>{t("auth.promise2")}</li>
          <li>{t("auth.promise3")}</li>
        </ul>
      </div>
      <div className="panel">
        <h1>{t("auth.loginTitle")}</h1>
        <p className="hint">{t("auth.loginHint")}</p>
        {errorKey && <p className="error" role="alert">{t(errorKey)}</p>}
        <a className="btn" href={oktaLoginUrl()}>{t("auth.loginBtn")}</a>
      </div>
    </div>
  );
};

export default Auth;
