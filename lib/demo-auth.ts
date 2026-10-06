// Public frontend test credentials only. These provide no production security.
export type DemoRole = 'donor' | 'admin';
export const demoCredentials = {
  donor: {email:'donor@pushthidham.org',password:'Demo@123'},
  admin: {email:'admin@pushthidham.org',password:'Admin@123'},
} as const;
const key = (role:DemoRole) => `pushthidham-demo-session-v1-${role}`;
export function hasDemoSession(role:DemoRole){
  try {const expected=JSON.stringify({mode:'frontend-demo',role});return sessionStorage.getItem(key(role))===expected||localStorage.getItem(key(role))===expected;}catch{return false;}
}
export function clearDemoSession(role:DemoRole){try{sessionStorage.removeItem(key(role));localStorage.removeItem(key(role));}catch{}window.dispatchEvent(new Event('demo-session-change'));}
export function loginDemo(role:DemoRole,email:string,password:string,remember=false):'success'|'invalid'|'storage-unavailable'{
  const expected=demoCredentials[role];if(email.trim()!==expected.email||password!==expected.password)return 'invalid';
  try{clearDemoSession(role);const storage=remember?localStorage:sessionStorage;storage.setItem(key(role),JSON.stringify({mode:'frontend-demo',role}));window.dispatchEvent(new Event('demo-session-change'));return 'success';}catch{return 'storage-unavailable';}
}
