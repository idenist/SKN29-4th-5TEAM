export default function AuthForm({ children, onSubmit, successMessage }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {children}
      {successMessage ? (
        <p className="auth-success" role="status">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}
