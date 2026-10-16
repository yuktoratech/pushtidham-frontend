'use client';

import {CatalogImage} from './catalog-image';
import {useRef, useState, type FormEvent} from 'react';
import {MapPin, Phone, Mail, Clock3, HandHeart, Check, type LucideIcon} from 'lucide-react';
import {templeContact} from '../lib/contact';
import {contactApi, authErrorMessage} from '../lib/api-client';

export function ContactHero() {
  return <section className="about-page-hero contact-hero" aria-labelledby="contact-title"><CatalogImage src={templeContact.image} alt="Haveli architectural artwork with domes and a tranquil garden"/><div className="about-page-hero-shade"/><div className="container about-page-hero-content"><h1 id="contact-title">Contact Us</h1><p>We would love to hear from you.</p></div></section>;
}
function ContactCard({icon: Icon, title, children}: {icon: LucideIcon; title: string; children: React.ReactNode}) {
  return <article className="contact-info-card"><span className="contact-icon"><Icon aria-hidden="true"/></span><div><h2>{title}</h2>{children}</div></article>;
}
type Field = 'name' | 'email' | 'phone' | 'subject' | 'message';
type ContactValues = Record<Field, string>;
const initial: ContactValues = {name: '', email: '', phone: '', subject: '', message: ''};
function validate(values: ContactValues) {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) errors.name = 'Please enter your full name.';
  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.phone && !/^[+0-9() .-]{1,30}$/.test(values.phone.trim())) errors.phone = 'Please enter a valid phone number.';
  if (!values.subject.trim()) errors.subject = 'Please enter a subject.';
  if (!values.message.trim()) errors.message = 'Please enter your message.';
  return errors;
}
export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [review, setReview] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  function update(field: Field, value: string) {
    const next = {...values, [field]: value};
    setValues(next);
    if (submitted) setErrors(validate(next));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    setSubmitted(true);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setReview(true);
    requestAnimationFrame(() => resultRef.current?.focus());
  }
  async function sendOnline() {
    if (sending) return;
    setSending(true);
    setDeliveryError('');
    try {
      await contactApi.send({name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), subject: values.subject.trim(), message: values.message.trim()});
      setSent(true);
    } catch (error) {
      setDeliveryError(`${authErrorMessage(error)} You can use the email action below instead.`);
    } finally {setSending(false);}
  }
  const messageBody = `${values.message}\n\nFrom: ${values.name}\nEmail: ${values.email}${values.phone ? `\nPhone: ${values.phone}` : ''}`;
  const emailHref = `mailto:${templeContact.email}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(messageBody)}`;
  function field(field: Field, label: string, type = 'text', optional = false) {
    return <div className="contact-field"><label htmlFor={`contact-${field}`}>{label}{optional ? <span> (optional)</span> : <span aria-hidden="true"> *</span>}</label><input id={`contact-${field}`} name={field} type={type} autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'off'} required={!optional} value={values[field]} maxLength={field === 'subject' ? 150 : 200} onChange={e => update(field, e.target.value)} onBlur={() => {if (values[field] || submitted) setErrors(prev => ({...prev, [field]: validate(values)[field]}));}} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `contact-${field}-error` : undefined}/>{errors[field] && <p id={`contact-${field}-error`} className="contact-error">{errors[field]}</p>}</div>;
  }
  return <section className="contact-form-panel" aria-labelledby="contact-form-title"><p className="eyebrow">Let’s connect</p><h2 id="contact-form-title">Send a Message</h2><p className="contact-form-intro">For darshan, seva or community enquiries, you can prepare your message here.</p>
    {review ? <div className="contact-success" ref={resultRef} tabIndex={-1} role="status"><span className="contact-success-icon"><Check aria-hidden="true"/></span><h3>{sent ? 'Message Accepted' : 'Review Your Message'}</h3><p>{sent ? 'The email provider accepted your message for delivery. This does not confirm that it reached the recipient.' : 'Review the message below before sending it online or opening a draft in your email app.'}</p><dl className="contact-message-review"><div><dt>Name</dt><dd>{values.name}</dd></div><div><dt>Email</dt><dd>{values.email}</dd></div>{values.phone && <div><dt>Phone</dt><dd>{values.phone}</dd></div>}<div><dt>Subject</dt><dd>{values.subject}</dd></div><div><dt>Message</dt><dd>{values.message}</dd></div></dl>{deliveryError && <p className="contact-error" role="alert">{deliveryError}</p>}{!sent && <><button className="button" type="button" onClick={sendOnline} disabled={sending}>{sending ? 'Sending…' : 'Send Online'}</button><p className="contact-success-note">Online delivery requires the temple email service. If unavailable, use your own email app.</p><a className="button button-outline" href={emailHref}>Open in Email App</a><button className="button button-outline" type="button" onClick={() => {setReview(false); setDeliveryError(''); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus());}}>Edit Message</button></>}<button className="button button-outline" type="button" onClick={() => {setReview(false); setSent(false); setValues(initial); setErrors({}); setSubmitted(false); setDeliveryError(''); requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus());}}>Prepare Another Message</button></div> :
      <form ref={formRef} onSubmit={submit} noValidate><p className="contact-required-note">* Required fields</p><div className="contact-fields">{field('name', 'Full Name')}{field('email', 'Email Address', 'email')}{field('phone', 'Phone Number', 'tel', true)}{field('subject', 'Subject')}<div className="contact-field contact-message"><label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label><textarea id="contact-message" name="message" rows={5} maxLength={5000} required value={values.message} onChange={e => update('message', e.target.value)} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-error' : undefined}/>{errors.message && <p id="contact-message-error" className="contact-error">{errors.message}</p>}</div></div><button className="button contact-send" type="submit">Review Message</button></form>}
  </section>;
}
export function ContactContent() {
  return <div className="container contact-content"><div className="contact-info-grid"><ContactCard icon={MapPin} title="Temple Address"><p>{templeContact.name}<br/>{templeContact.address}</p><p className="contact-pending">{templeContact.organization}</p></ContactCard><ContactCard icon={Phone} title="Phone"><a href={`tel:${templeContact.phoneHref}`}>{templeContact.phone}</a></ContactCard><ContactCard icon={Mail} title="Email"><a href={`mailto:${templeContact.email}`}>{templeContact.email}</a></ContactCard><ContactCard icon={Clock3} title="Plan Your Visit"><p>{templeContact.visitingNote}</p></ContactCard></div><div className="contact-main-grid"><ContactForm/><section className="contact-location" aria-labelledby="contact-location-title"><p className="eyebrow">A spiritual home</p><h2 id="contact-location-title">Visit the Haveli</h2><p>Come for darshan, connect with our community and share in the spirit of seva.</p><div className="contact-location-visual"><CatalogImage src={templeContact.image} alt="Temple-inspired Haveli architectural artwork"/><div className="contact-location-caption"><MapPin aria-hidden="true"/><div><strong>{templeContact.name}</strong><span>{templeContact.address}</span></div></div></div><div className="contact-location-note"><MapPin aria-hidden="true"/><p>{templeContact.organization} · Federal ID {templeContact.federalId}</p></div><a className="button button-outline" href={templeContact.mapsUrl} target="_blank" rel="noopener noreferrer">Get Directions</a><div className="contact-welcome"><HandHeart aria-hidden="true"/><p>All are welcome at Pushtidham Haveli.</p></div></section></div></div>;
}
