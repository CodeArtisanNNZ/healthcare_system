import { logout } from "../actions";
export default function Logout() {
  return (
    <section className="auth card">
      <h1>Sign out?</h1>
      <form action={logout}>
        <button>Sign out</button>
      </form>
    </section>
  );
}
