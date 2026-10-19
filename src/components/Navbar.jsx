import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import "./Navbar.css";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/archive", label: "Archive" },
  {
    label: "Study",
    children: [
      { to: "/flashcards", label: "Flashcards" },
      { to: "/quiz", label: "Quiz" },
    ],
  },
  { to: "/recognize", label: "Recognize" },
  { to: "/natyashastra", label: "Nāṭyaśāstra" },
];

function StudyDropdown({ item }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const isActive = item.children.some((c) => location.pathname === c.to);

  useEffect(() => {
    if (!open) return;
    function place() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setCoords({ top: r.bottom + 8, left: r.left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="nav-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className={"nav-link nav-dropdown-trigger" + (isActive ? " active" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {item.label} <span className="nav-caret">▾</span>
      </button>
      {open && coords &&
        createPortal(
          <div
            ref={menuRef}
            className="nav-dropdown-menu"
            style={{ top: coords.top, left: coords.left }}
          >
            {item.children.map((c) => (
              <NavLink
                key={c.to}
                to={c.to}
                className={({ isActive }) => "nav-dropdown-item" + (isActive ? " active" : "")}
              >
                {c.label}
              </NavLink>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">ॐ</span> Natya Archive
        </NavLink>
        <nav className="nav-links">
          {LINKS.map((l) =>
            l.children ? (
              <StudyDropdown key={l.label} item={l} />
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                end={l.to === "/"}
              >
                {l.label}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
