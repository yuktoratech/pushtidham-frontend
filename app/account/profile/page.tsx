'use client';

import {useState, type FormEvent} from 'react';
import {Check, PencilLine, UserRound} from 'lucide-react';
import {AccountLayout} from '../../../components/account-layout';
import {FormInput} from '../../../components/auth-form';
import {useAuth} from '../../../components/auth-provider';
import {ApiError, authApi, authErrorMessage} from '../../../lib/api-client';
import {userContact} from '../../../lib/auth-state';

type ProfileField = 'firstName' | 'lastName' | 'email' | 'phone';
type Values = Record<ProfileField, string>;
type ProfileErrors = Partial<Record<ProfileField, string>>;

function validate(values: Values): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!values.firstName.trim()) errors.firstName = 'Please enter your first name.';
  if (!values.lastName.trim()) errors.lastName = 'Please enter your last name.';
  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.phone && !/^[+0-9() .-]{1,30}$/.test(values.phone.trim())) errors.phone = 'Please enter a valid phone number.';
  if (`${values.firstName.trim()} ${values.lastName.trim()}`.length > 120) errors.firstName = 'Your full name must not exceed 120 characters.';
  return errors;
}

export default function ProfilePage() {
  const {user, restore} = useAuth();
  const contact = userContact(user);
  const [values, setValues] = useState<Values>(contact);
  const identity = `${user?.id}|${user?.name}|${user?.email}|${user?.phone}`;
  const [previousIdentity, setPreviousIdentity] = useState(identity);
  if (previousIdentity !== identity) {
    setPreviousIdentity(identity);
    setValues(contact);
  }
  const [editing, setEditing] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  function update(field: ProfileField, value: string) {
    const next = {...values, [field]: value};
    setValues(next);
    if (attempted) setErrors(validate(next));
  }
  function props(field: ProfileField, label: string, autoComplete: string, type = 'text') {
    return {id: `profile-${field}`, label, value: values[field], onChange: (value: string) => update(field, value), onBlur: () => {
      if (values[field] || attempted) setErrors(prev => ({...prev, [field]: validate(values)[field]}));
    }, error: errors[field], autoComplete, type, optional: field === 'phone'};
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setAttempted(true);
    setFailure('');
    const next = validate(values);
    setErrors(next);
    const first = Object.keys(next)[0] as ProfileField | undefined;
    if (first) {document.getElementById(`profile-${first}`)?.focus(); return;}
    setSaving(true);
    try {
      const updated = await authApi.profile({
        name: `${values.firstName.trim()} ${values.lastName.trim()}`,
        email: values.email.trim(),
        phone: values.phone.trim(),
      });
      setValues(userContact(updated));
      await restore();
      setEditing(false);
      setNotice('Your profile was saved.');
    } catch (error) {
      setFailure(authErrorMessage(error));
      if (error instanceof ApiError) {
        const fields: ProfileErrors = {};
        error.details.forEach(issue => {
          if (issue.path === 'name') fields.firstName = issue.message;
          if (issue.path === 'email') fields.email = issue.message;
          if (issue.path === 'phone') fields.phone = issue.message;
        });
        setErrors(fields);
      }
    } finally {setSaving(false);}
  }
  function stopEditing() {
    setEditing(false);
    setAttempted(false);
    setErrors({});
    setFailure('');
    setValues(contact);
  }
  return <AccountLayout title="My Profile" description="Review and update your donor account contact details.">
    <section className="account-panel profile-panel" aria-labelledby="profile-panel-title">
      <div className="account-panel-heading"><span className="account-summary-icon"><UserRound aria-hidden="true"/></span><div><p className="eyebrow">Donor details</p><h2 id="profile-panel-title">Profile Information</h2></div></div>
      {notice && <div className="account-success" role="status"><Check aria-hidden="true"/><p>{notice}</p></div>}
      {failure && <p className="auth-error" role="alert">{failure}</p>}
      {!editing ? <><dl className="profile-detail-list"><div><dt>First Name</dt><dd>{values.firstName}</dd></div><div><dt>Last Name</dt><dd>{values.lastName}</dd></div><div><dt>Email Address</dt><dd>{values.email}</dd></div><div><dt>Phone Number</dt><dd>{values.phone || 'Not provided'}</dd></div></dl><button className="button profile-edit-button" onClick={() => {setEditing(true); setNotice('');}}><PencilLine aria-hidden="true"/>Edit Profile</button></> : <form className="account-form" onSubmit={submit} noValidate><div className="account-profile-form-grid"><FormInput {...props('firstName', 'First Name', 'given-name')}/><FormInput {...props('lastName', 'Last Name', 'family-name')}/><div className="account-form-span"><FormInput {...props('email', 'Email Address', 'email', 'email')}/></div><div className="account-form-span"><FormInput {...props('phone', 'Phone Number', 'tel', 'tel')}/></div></div><div className="account-form-actions"><button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button><button className="account-cancel-button" type="button" onClick={stopEditing} disabled={saving}>Cancel</button></div></form>}
    </section>
  </AccountLayout>;
}
