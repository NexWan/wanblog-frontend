"use client";

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  confirmResetPassword,
  confirmSignUp,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type AuthMode =
  | "sign-in"
  | "sign-up"
  | "confirm-sign-up"
  | "forgot-password"
  | "reset-password"
  | "authenticated";

type SignInValues = {
  email: string;
  password: string;
};

type SignUpValues = {
  email: string;
  displayName: string;
  givenName: string;
  password: string;
  confirmPassword: string;
};

type ResetValues = {
  code: string;
  password: string;
  confirmPassword: string;
};

type FeedbackState = {
  kind: "error" | "success";
  message: string;
} | null;

const DEFAULT_SIGN_IN_VALUES: SignInValues = {
  email: "",
  password: "",
};

const DEFAULT_SIGN_UP_VALUES: SignUpValues = {
  email: "",
  displayName: "",
  givenName: "",
  password: "",
  confirmPassword: "",
};

const DEFAULT_RESET_VALUES: ResetValues = {
  code: "",
  password: "",
  confirmPassword: "",
};

const inputClassName =
  "w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/80 px-4 py-3.5 pl-12 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/55 focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/15";

const tabClassName =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 font-label text-[11px] uppercase tracking-[0.24em] leading-none transition-all";

const featureItems = [
  {
    eyebrow: "Editorial Access",
    title: "Write, curate, and publish from one focused space.",
    copy:
      "The custom auth flow mirrors the blog's atmosphere so the entry point feels like part of the product, not a separate widget.",
  },
  {
    eyebrow: "Private Drafts",
    title: "Keep unfinished posts protected behind your author login.",
    copy:
      "Once you are inside, your draft workflow, publish controls, and admin tools stay tied to the same secure account.",
  },
  {
    eyebrow: "Cognito Backed",
    title: "Real Amplify auth underneath, custom UI on top.",
    copy:
      "We are keeping the AWS auth flow intact while giving the forms a cleaner editorial treatment that matches WanBlog.",
  },
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getAuthCopy(mode: AuthMode) {
  if (mode === "sign-up" || mode === "confirm-sign-up") {
    return {
      eyebrow: "Create Account",
      title: "Join the movement.",
      description:
        "Set up your author account with the same editorial rhythm as the rest of the blog.",
    };
  }

  if (mode === "forgot-password" || mode === "reset-password") {
    return {
      eyebrow: "Recover Access",
      title: "Reset your password.",
      description:
        "We will send a verification code to your email so you can get back into the dashboard safely.",
    };
  }

  if (mode === "authenticated") {
    return {
      eyebrow: "Session Active",
      title: "You are already inside.",
      description:
        "Your account is authenticated, so you can head back to reading or jump straight into the admin workspace.",
    };
  }

  return {
    eyebrow: "Welcome Back",
    title: "Sign in to WanBlog.",
    description:
      "A custom login surface inspired by your Stitch comps, wired to the real Amplify auth flow underneath.",
  };
}

function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [signInValues, setSignInValues] = useState<SignInValues>(DEFAULT_SIGN_IN_VALUES);
  const [signUpValues, setSignUpValues] = useState<SignUpValues>(DEFAULT_SIGN_UP_VALUES);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [resetValues, setResetValues] = useState<ResetValues>(DEFAULT_RESET_VALUES);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        await getCurrentUser();

        if (isActive) {
          setMode("authenticated");
        }
      } catch {
        if (isActive) {
          setMode("sign-in");
        }
      } finally {
        if (isActive) {
          setCheckedSession(true);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const authCopy = getAuthCopy(mode);

  function switchMode(nextMode: Exclude<AuthMode, "authenticated">) {
    setFeedback(null);
    setMode(nextMode);
  }

  function handleSignInSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const email = sanitizeEmail(signInValues.email);
    const password = signInValues.password;

    if (!email || !password) {
      setFeedback({
        kind: "error",
        message: "Please enter both your email and password.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await signIn({
            username: email,
            password,
          });

          setMode("authenticated");
          setFeedback({
            kind: "success",
            message: "You are signed in. Taking you back to the site now.",
          });
          router.refresh();
          router.push("/");
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleSignUpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const email = sanitizeEmail(signUpValues.email);
    const displayName = signUpValues.displayName.trim();
    const givenName = signUpValues.givenName.trim();
    const password = signUpValues.password;
    const confirmPassword = signUpValues.confirmPassword;

    if (!email || !displayName || !password || !confirmPassword) {
      setFeedback({
        kind: "error",
        message: "Email, display name, password, and confirm password are required.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        kind: "error",
        message: "Passwords do not match yet. Please review them and try again.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const result = await signUp({
            username: email,
            password,
            options: {
              userAttributes: {
                email,
                preferred_username: displayName,
                ...(givenName ? { given_name: givenName } : {}),
              },
            },
          });

          setCurrentEmail(email);
          setConfirmationCode("");

          if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
            setMode("confirm-sign-up");
            setFeedback({
              kind: "success",
              message: "We sent a verification code to your email. Enter it below to finish creating the account.",
            });
            return;
          }

          setSignInValues({
            email,
            password: "",
          });
          setMode("sign-in");
          setFeedback({
            kind: "success",
            message: "Your account is ready. You can sign in now.",
          });
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleConfirmSignUpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const email = currentEmail || sanitizeEmail(signUpValues.email);
    const code = confirmationCode.trim();

    if (!email || !code) {
      setFeedback({
        kind: "error",
        message: "Please enter the email and the verification code.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await confirmSignUp({
            username: email,
            confirmationCode: code,
          });

          setSignInValues((currentValues) => ({
            ...currentValues,
            email,
          }));
          setMode("sign-in");
          setFeedback({
            kind: "success",
            message: "Your email is confirmed. You can sign in now.",
          });
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleResendCode() {
    setFeedback(null);

    const email = currentEmail || sanitizeEmail(signUpValues.email);
    if (!email) {
      setFeedback({
        kind: "error",
        message: "Enter your email in the signup form first so we know where to send the code.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await resendSignUpCode({
            username: email,
          });

          setFeedback({
            kind: "success",
            message: "A fresh confirmation code is on its way to your inbox.",
          });
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleForgotPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const email = sanitizeEmail(signInValues.email || currentEmail);
    if (!email) {
      setFeedback({
        kind: "error",
        message: "Enter your email first so we can send the reset code to the right inbox.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await resetPassword({
            username: email,
          });

          setCurrentEmail(email);
          setResetValues(DEFAULT_RESET_VALUES);
          setMode("reset-password");
          setFeedback({
            kind: "success",
            message: "We sent you a reset code. Enter it with your new password below.",
          });
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleResetPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const email = sanitizeEmail(currentEmail || signInValues.email);
    const code = resetValues.code.trim();
    const password = resetValues.password;
    const confirmPassword = resetValues.confirmPassword;

    if (!email || !code || !password || !confirmPassword) {
      setFeedback({
        kind: "error",
        message: "Please complete the email, code, password, and confirmation fields.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        kind: "error",
        message: "The new passwords do not match yet.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await confirmResetPassword({
            username: email,
            confirmationCode: code,
            newPassword: password,
          });

          setSignInValues({
            email,
            password: "",
          });
          setMode("sign-in");
          setFeedback({
            kind: "success",
            message: "Password updated. You can sign in with the new password now.",
          });
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function handleSignOut() {
    setFeedback(null);

    startTransition(() => {
      void (async () => {
        try {
          await signOut();
          setMode("sign-in");
          setCheckedSession(true);
          setFeedback({
            kind: "success",
            message: "You have been signed out.",
          });
          router.refresh();
        } catch (error: unknown) {
          setFeedback({
            kind: "error",
            message: getErrorMessage(error),
          });
        }
      })();
    });
  }

  function renderFeedback() {
    if (!feedback) {
      return null;
    }

    const isSuccess = feedback.kind === "success";

    return (
      <div
        className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
          isSuccess
            ? "border-tertiary/20 bg-tertiary/8 text-tertiary"
            : "border-error/20 bg-error/8 text-error"
        }`}
      >
        {feedback.message}
      </div>
    );
  }

  function renderSignInForm() {
    return (
      <form className="space-y-5" onSubmit={handleSignInSubmit}>
        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-signin-email"
          >
            Email Address
          </label>
          <div className="relative">
            <MailOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-signin-email"
              type="email"
              autoComplete="email"
              placeholder="writer@wanblog.com"
              className={inputClassName}
              value={signInValues.email}
              onChange={(event) =>
                setSignInValues((currentValues) => ({
                  ...currentValues,
                  email: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 px-1">
            <label
              className="block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
              htmlFor="auth-signin-password"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => switchMode("forgot-password")}
              className="font-label text-[10px] uppercase tracking-[0.28em] text-primary transition hover:text-tertiary"
            >
              Forgot Password
            </button>
          </div>
          <div className="relative">
            <LockOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={inputClassName}
              value={signInValues.password}
              onChange={(event) =>
                setSignInValues((currentValues) => ({
                  ...currentValues,
                  password: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="primary-gradient inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.28em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing In" : "Sign In"}
        </button>
      </form>
    );
  }

  function renderSignUpForm() {
    return (
      <form className="space-y-5" onSubmit={handleSignUpSubmit}>
        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-signup-display-name"
          >
            Display Name
          </label>
          <div className="relative">
            <UserOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-signup-display-name"
              type="text"
              autoComplete="nickname"
              placeholder="Wan Curator"
              className={inputClassName}
              value={signUpValues.displayName}
              onChange={(event) =>
                setSignUpValues((currentValues) => ({
                  ...currentValues,
                  displayName: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-signup-given-name"
          >
            First Name
          </label>
          <div className="relative">
            <UserOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-signup-given-name"
              type="text"
              autoComplete="given-name"
              placeholder="Leonardo"
              className={inputClassName}
              value={signUpValues.givenName}
              onChange={(event) =>
                setSignUpValues((currentValues) => ({
                  ...currentValues,
                  givenName: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-signup-email"
          >
            Email Address
          </label>
          <div className="relative">
            <MailOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-signup-email"
              type="email"
              autoComplete="email"
              placeholder="writer@wanblog.com"
              className={inputClassName}
              value={signUpValues.email}
              onChange={(event) =>
                setSignUpValues((currentValues) => ({
                  ...currentValues,
                  email: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
              htmlFor="auth-signup-password"
            >
              Password
            </label>
            <div className="relative">
              <LockOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="auth-signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="Create password"
                className={inputClassName}
                value={signUpValues.password}
                onChange={(event) =>
                  setSignUpValues((currentValues) => ({
                    ...currentValues,
                    password: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
              htmlFor="auth-signup-confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative">
              <SafetyCertificateOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="auth-signup-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                className={inputClassName}
                value={signUpValues.confirmPassword}
                onChange={(event) =>
                  setSignUpValues((currentValues) => ({
                    ...currentValues,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="primary-gradient inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.28em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating Account" : "Sign Up"}
        </button>
      </form>
    );
  }

  function renderConfirmSignUpForm() {
    const email = currentEmail || sanitizeEmail(signUpValues.email);

    return (
      <form className="space-y-5" onSubmit={handleConfirmSignUpSubmit}>
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/70 px-4 py-4 text-sm leading-relaxed text-on-surface-variant">
          Confirm the code sent to <span className="font-semibold text-on-surface">{email || "your email"}</span>.
        </div>

        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-confirm-code"
          >
            Verification Code
          </label>
          <div className="relative">
            <CheckCircleFilled className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <input
              id="auth-confirm-code"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              className={inputClassName}
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="primary-gradient inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.28em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Confirming" : "Confirm Account"}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={isPending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-high/45 px-5 py-3 font-label text-xs uppercase tracking-[0.24em] text-on-surface transition hover:bg-surface-container-highest/55 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ReloadOutlined />
          Resend Code
        </button>
      </form>
    );
  }

  function renderForgotPasswordForm() {
    return (
      <form className="space-y-5" onSubmit={handleForgotPasswordSubmit}>
        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-forgot-email"
          >
            Email Address
          </label>
          <div className="relative">
            <MailOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              id="auth-forgot-email"
              type="email"
              autoComplete="email"
              placeholder="writer@wanblog.com"
              className={inputClassName}
              value={signInValues.email}
              onChange={(event) =>
                setSignInValues((currentValues) => ({
                  ...currentValues,
                  email: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="primary-gradient inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.28em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending Code" : "Send Reset Code"}
        </button>
      </form>
    );
  }

  function renderResetPasswordForm() {
    return (
      <form className="space-y-5" onSubmit={handleResetPasswordSubmit}>
        <div className="space-y-2">
          <label
            className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
            htmlFor="auth-reset-code"
          >
            Verification Code
          </label>
          <div className="relative">
            <CheckCircleFilled className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
            <input
              id="auth-reset-code"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              className={inputClassName}
              value={resetValues.code}
              onChange={(event) =>
                setResetValues((currentValues) => ({
                  ...currentValues,
                  code: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
              htmlFor="auth-reset-password"
            >
              New Password
            </label>
            <div className="relative">
              <LockOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="auth-reset-password"
                type="password"
                autoComplete="new-password"
                placeholder="Create password"
                className={inputClassName}
                value={resetValues.password}
                onChange={(event) =>
                  setResetValues((currentValues) => ({
                    ...currentValues,
                    password: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="ml-1 block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant"
              htmlFor="auth-reset-confirm-password"
            >
              Confirm Password
            </label>
            <div className="relative">
              <SafetyCertificateOutlined className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="auth-reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                className={inputClassName}
                value={resetValues.confirmPassword}
                onChange={(event) =>
                  setResetValues((currentValues) => ({
                    ...currentValues,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="primary-gradient inline-flex min-h-13 w-full items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.28em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating Password" : "Update Password"}
        </button>
      </form>
    );
  }

  function renderAuthenticatedState() {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-tertiary/20 bg-tertiary/8 px-4 py-4 text-sm leading-relaxed text-tertiary">
          Your session is active and the header controls should now show your account state.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-high/40 px-5 py-3 font-label text-xs uppercase tracking-[0.24em] text-on-surface transition hover:bg-surface-container-highest/55"
          >
            Back Home
          </Link>
          <Link
            href="/admin"
            className="primary-gradient inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.24em] text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95"
          >
            Open Admin
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-primary/25 px-5 py-3 font-label text-xs uppercase tracking-[0.24em] text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing Out" : "Sign Out"}
        </button>
      </div>
    );
  }

  function renderFormBody() {
    if (!checkedSession) {
      return (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/65 px-4 py-5 text-sm text-on-surface-variant">
          Checking your session...
        </div>
      );
    }

    if (mode === "sign-up") {
      return renderSignUpForm();
    }

    if (mode === "confirm-sign-up") {
      return renderConfirmSignUpForm();
    }

    if (mode === "forgot-password") {
      return renderForgotPasswordForm();
    }

    if (mode === "reset-password") {
      return renderResetPasswordForm();
    }

    if (mode === "authenticated") {
      return renderAuthenticatedState();
    }

    return renderSignInForm();
  }

  return (
    <main className="relative isolate overflow-hidden px-6 py-10 md:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,133,201,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(184,255,187,0.12),transparent_24%),linear-gradient(180deg,transparent,rgba(0,0,0,0.12))]" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] -z-10 h-80 w-80 rounded-full bg-secondary/12 blur-[150px]" />

      <div className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-low/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="mb-10 max-w-xl">
            <p className="font-label text-[11px] uppercase tracking-[0.35em] text-primary">
              Stitch Inspired Authentication
            </p>
            <h1 className="mt-5 font-headline text-4xl font-black tracking-tight text-on-surface md:text-6xl">
              A login flow that finally looks like it belongs here.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
              The default Amplify form worked, but it felt visually detached from WanBlog. This version pulls from the
              exported login and signup comps so the entrance experience matches the editorial atmosphere of the site.
            </p>
          </div>

          <div className="grid gap-4">
            {featureItems.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-outline-variant/12 bg-surface-container-high/45 p-5 transition hover:border-primary/25 hover:bg-surface-container-highest/45"
              >
                <p className="font-label text-[10px] uppercase tracking-[0.28em] text-primary">{item.eyebrow}</p>
                <h2 className="mt-3 font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{item.copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4 opacity-60">
            <div className="h-px flex-1 bg-outline-variant/30" />
            <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
              WanBlog Access Layer
            </span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container/65 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-2xl md:p-8">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/14 blur-[100px]" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-tertiary/10 blur-[120px]" />

          <div className="relative z-10">
            <div className="mb-8">
              <p className="font-label text-[11px] uppercase tracking-[0.35em] text-primary">{authCopy.eyebrow}</p>
              <h2 className="mt-4 font-headline text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                {authCopy.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant md:text-base">
                {authCopy.description}
              </p>
            </div>

            {mode !== "confirm-sign-up" && mode !== "forgot-password" && mode !== "reset-password" && mode !== "authenticated" ? (
              <div className="mb-6 inline-flex w-full rounded-full border border-outline-variant/15 bg-surface-container-low/80 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("sign-in")}
                  className={`${tabClassName} ${
                    mode === "sign-in"
                      ? "border-primary/20 bg-primary/12 text-primary shadow-sm shadow-primary/10"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  } flex-1`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("sign-up")}
                  className={`${tabClassName} ${
                    mode === "sign-up"
                      ? "border-primary/20 bg-primary/12 text-primary shadow-sm shadow-primary/10"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  } flex-1`}
                >
                  Sign Up
                </button>
              </div>
            ) : null}

            {renderFeedback()}

            <div className={`${feedback ? "mt-5" : ""}`}>{renderFormBody()}</div>

            {mode === "sign-up" ? (
              <p className="mt-8 text-center text-sm text-on-surface-variant">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("sign-in")}
                  className="font-semibold text-primary transition hover:text-tertiary"
                >
                  Log in
                </button>
              </p>
            ) : null}

            {mode === "sign-in" ? (
              <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-on-surface-variant">
                <span>Need a new account?</span>
                <button
                  type="button"
                  onClick={() => switchMode("sign-up")}
                  className="inline-flex items-center gap-2 font-semibold text-tertiary transition hover:text-primary"
                >
                  Create one
                  <ArrowRightOutlined />
                </button>
              </p>
            ) : null}

            {mode === "forgot-password" || mode === "reset-password" || mode === "confirm-sign-up" ? (
              <div className="mt-8 text-center text-sm text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => switchMode("sign-in")}
                  className="font-semibold text-primary transition hover:text-tertiary"
                >
                  Back to login
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
