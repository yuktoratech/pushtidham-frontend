'use client';

import {useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {KeyRound} from 'lucide-react';
import {AccountLayout} from '../../../components/account-layout';
import {PasswordInput} from '../../../components/auth-form';
import {useAuth} from '../../../components/auth-provider';
import {ApiError, authApi, authErrorMessage} from '../../../lib/api-client';
import {registrationPasswordRequirements} from '../../../lib/auth-ui';

type Field = 'currentPassword' | 'newPassword' | 'confirmPassword';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
const initial: Values = {currentPassword: '', newPassword: '', confirmPassword: ''};
function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.currentPassword) errors.currentPassword = 'Please enter your current password.';
  if (!values.newPassword) errors.newPassword = 'Please enter a new password.';
  else if (values.newPassword.length < 8 || values.newPassword.length > 72 || new TextEncoder().encode(values.newPassword).length > 72) errors.newPassword = registrationPasswordRequirements;
  else if (values.currentPassword === values.newPassword) errors.newPassword = 'Choose a new password that differs from your current password.';
  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your new password.';
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Your passwords do not match.';
  return errors;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const {logout} = useAuth();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  function update(field: Field, value: string) {
    const next = {...values, [field]: value};
    setValues(next);
    if (attempted) setErrors(validate(next));
  }
  function props(field: Field, label: string, autoComplete: string, help?: string) {
    return {id: `account-${field}`, label, value: values[field], onChange: (value: string) => update(field, value), onBlur: () => {
      if (values[field] || attempted) setErrors(prev => ({...prev, [field]: validate(values)[field]}));
    }, error: errors[field], autoComplete, help};
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setAttempted(true);
    setFailure('');
    const next = validate(values);
    setErrors(next);
    const first = Object.keys(next)[0] as Field | undefined;
    if (first) {document.getElementById(`account-${first}`)?.focus(); return;}
    setPending(true);
    try {
      await authApi.changePassword(values);
      setValues(initial);
      await logout();
      router.replace('/login?passwordChanged=1');
    } catch (error) {
      setFailure(authErrorMessage(error));
      if (error instanceof ApiError) {
        const fields: Errors = {};
        error.details.forEach(issue => {if (issue.path in initial) fields[issue.path as Field] = issue.message;});
        if (error.code === 'INVALID_CURRENT_PASSWORD') fields.currentPassword = error.message;
        setErrors(fields);
      }
    } finally {setPending(false);}
  }
  return <AccountLayout title="Change Password" description="Update the password for your donor account.">
    <section className="account-panel account-password-panel" aria-labelledby="change-password-title">
      <div className="account-panel-heading"><span className="account-summary-icon"><KeyRound aria-hidden="true"/></span><div><p className="eyebrow">Account security</p><h2 id="change-password-title">Change Password</h2></div></div>
      <p>After changing your password, all sessions will be signed out. Sign in again with the new password.</p>
      {failure && <p className="auth-error" role="alert">{failure}</p>}
      <form className="account-form account-password-form" onSubmit={submit} noValidate><PasswordInput {...props('currentPassword', 'Current Password', 'current-password')}/><PasswordInput {...props('newPassword', 'New Password', 'new-password', registrationPasswordRequirements)}/><PasswordInput {...props('confirmPassword', 'Confirm New Password', 'new-password')}/><button className="button account-password-submit" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Change Password'}</button></form>
    </section>
  </AccountLayout>;
}
