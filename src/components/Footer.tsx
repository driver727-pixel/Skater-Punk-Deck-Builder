import { NavLink } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <span className="site-footer__copy">
        © {new Date().getFullYear()} SP Digital LLC. All Rights Reserved.
      </span>
      <NavLink to="/credits" className="site-footer__link">
        Credits
      </NavLink>
    </footer>
  );
}
