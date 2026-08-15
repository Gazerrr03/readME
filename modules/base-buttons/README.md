# Base buttons

Base buttons are the five top-level desktop entry points: design, about,
projects, contact, and writing. Their shared selection and open behavior is
implemented by `scripts/desktop.js`; each directory here owns the application
that opens after the entry is activated.

The code name for the design entry is currently `settings`. Keep that ID stable
until the product naming is intentionally aligned.
