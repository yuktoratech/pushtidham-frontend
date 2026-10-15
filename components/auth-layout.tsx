import {CatalogImage} from './catalog-image';
import { PageLink } from './page-link';
import { Landmark, HandHeart } from 'lucide-react';
import { Header, Footer, MobileBottomNav } from './layout';
import { AuthForm } from './auth-form';
import { type AuthMode } from '../lib/auth-ui';
export function AuthLayout({mode}:{mode:AuthMode}){return <><PageLink className="skip-link" href="#main">Skip to content</PageLink><Header/><main id="main" className={`auth-page auth-page-${mode}`}><div className="container auth-container"><div className="auth-shell"><aside className="auth-devotional" aria-label="A community of devotion"><CatalogImage src="/images/haveli-about.webp" alt="Temple-inspired Haveli architectural artwork"/><div className="auth-devotional-shade"/><div className="auth-devotional-copy"><HandHeart aria-hidden="true"/><p className="eyebrow">Pushtidham Haveli</p><h2>A Community of Devotion</h2><p>Rooted in faith.<br/>United through seva.</p><span>Seva · Bhakti · Sanskar</span></div></aside><section className="auth-card" aria-labelledby="auth-title"><div className="auth-card-mark" aria-hidden="true"><Landmark/></div><AuthForm mode={mode}/></section></div><PageLink className="auth-home-link" href="/">Back to the Haveli Home</PageLink></div></main><Footer/><MobileBottomNav/></>;}
