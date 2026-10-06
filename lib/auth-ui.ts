export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';
export type AuthField = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirmPassword';
export type AuthValues = Record<AuthField, string>;
export const emptyAuthValues: AuthValues = {firstName:'',lastName:'',email:'',phone:'',password:'',confirmPassword:''};
export const authCopy = {
  login: {title:'Welcome Back',subtitle:'Connect with your donor account.',button:'Login'},
  register: {title:'Create Account',subtitle:'Join our community of devotion and seva.',button:'Create Account'},
  'forgot-password': {title:'Forgot Password?',subtitle:'We’ll help you find your way back to your account.',button:'Send Reset Link'},
  'reset-password': {title:'Reset Password',subtitle:'Choose a new password for your donor account.',button:'Reset Password'},
};
export const passwordRequirements = 'Use at least 8 characters, including a letter and a number.';
export function validateAuth(mode:AuthMode, values:AuthValues) {
  const errors:Partial<Record<AuthField,string>>={};
  if(mode==='register'){
    if(!values.firstName.trim())errors.firstName='Please enter your first name.';
    if(!values.lastName.trim())errors.lastName='Please enter your last name.';
  }
  if(mode!=='reset-password'){
    if(!values.email.trim())errors.email='Please enter your email address.';
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))errors.email='Please enter a valid email address.';
  }
  if(mode!=='forgot-password'){
    if(!values.password)errors.password='Please enter your password.';
    else if(mode!=='login'&&(values.password.length<8||!/[a-zA-Z]/.test(values.password)||!/[0-9]/.test(values.password)))errors.password=passwordRequirements;
  }
  if(mode==='register'||mode==='reset-password'){
    if(!values.confirmPassword)errors.confirmPassword='Please confirm your password.';
    else if(values.confirmPassword!==values.password)errors.confirmPassword='Your passwords do not match.';
  }
  return errors;
}
