/**
 * POS Validation Hook
 * 
 * React hook for field and form validation in POS screens.
 * Provides client-side validation that mirrors backend rules.
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const ValidationSeverity = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ============================================
// FIELD VALIDATORS
// ============================================

export const Validators = {
  // Required field
  required: (message = 'This field is required') => (value) => {
    const valid = value !== null && value !== undefined && value !== '';
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  // String length
  minLength: (min, message) => (value) => {
    if (!value) return null;
    const valid = String(value).length >= min;
    return valid ? null : { 
      message: message || `Must be at least ${min} characters`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    const valid = String(value).length <= max;
    return valid ? null : { 
      message: message || `Must not exceed ${max} characters`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  // Numeric
  positive: (message = 'Must be greater than zero') => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const valid = Number(value) > 0;
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  nonNegative: (message = 'Must not be negative') => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const valid = Number(value) >= 0;
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  min: (minValue, message) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const valid = Number(value) >= minValue;
    return valid ? null : { 
      message: message || `Must be at least ${minValue}`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  max: (maxValue, message) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const valid = Number(value) <= maxValue;
    return valid ? null : { 
      message: message || `Must not exceed ${maxValue}`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  range: (minValue, maxValue, message) => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    const valid = num >= minValue && num <= maxValue;
    return valid ? null : { 
      message: message || `Must be between ${minValue} and ${maxValue}`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  percentage: (message = 'Must be between 0 and 100') => (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    const valid = num >= 0 && num <= 100;
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  // Format validators
  email: (message = 'Must be a valid email address') => (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(value);
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  phone: (message = 'Must be a valid phone number') => (value) => {
    if (!value) return null;
    const phoneRegex = /^[\d\s\-\(\)\+\.]{10,20}$/;
    const valid = phoneRegex.test(value.replace(/\s/g, ''));
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null;
    const valid = regex.test(String(value));
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  stateCode: (message = 'Must be a valid 2-letter state code') => (value) => {
    if (!value) return null;
    const valid = /^[A-Z]{2}$/.test(value.toUpperCase());
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  postalCode: (message = 'Must be a valid postal code') => (value) => {
    if (!value) return null;
    const valid = /^\d{5}(-\d{4})?$/.test(value);
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  // Date validators
  futureDate: (message = 'Must be today or in the future') => (value) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = date >= today;
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  pastDate: (message = 'Must be in the past') => (value) => {
    if (!value) return null;
    const date = new Date(value);
    const valid = date <= new Date();
    return valid ? null : { message, severity: ValidationSeverity.ERROR };
  },

  // Enum validator
  oneOf: (allowedValues, message) => (value) => {
    if (!value) return null;
    const valid = allowedValues.includes(value);
    return valid ? null : { 
      message: message || `Must be one of: ${allowedValues.join(', ')}`, 
      severity: ValidationSeverity.ERROR 
    };
  },

  // Custom validator
  custom: (validateFn, message, severity = ValidationSeverity.ERROR) => (value, allValues) => {
    const valid = validateFn(value, allValues);
    return valid ? null : { message, severity };
  },

  // Warning (non-blocking)
  warning: (validateFn, message) => (value, allValues) => {
    const valid = validateFn(value, allValues);
    return valid ? null : { message, severity: ValidationSeverity.WARNING };
  }
};

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const ValidationSchemas = {
  customer: {
    id: [Validators.required()],
    name: [Validators.required(), Validators.maxLength(200)],
    email: [Validators.email()],
    phone: [Validators.phone()]
  },

  address: {
    name: [Validators.required(), Validators.maxLength(100)],
    addressLine1: [Validators.required(), Validators.maxLength(200)],
    city: [Validators.required(), Validators.maxLength(100)],
    state: [Validators.required(), Validators.stateCode()],
    postalCode: [Validators.required(), Validators.postalCode()]
  },

  lineItem: {
    productId: [Validators.required()],
    quantity: [Validators.required(), Validators.positive()],
    unitPrice: [Validators.required(), Validators.nonNegative()]
  },

  payment: {
    method: [Validators.required(), Validators.oneOf(['TERMS', 'CASH', 'CHECK', 'CREDIT_CARD', 'WIRE', 'ACH'])],
    amountTendered: [Validators.nonNegative()]
  },

  delivery: {
    method: [Validators.required(), Validators.oneOf(['DELIVERY', 'WILL_CALL', 'SHIP_CARRIER', 'CUSTOMER_PICKUP'])],
    requestedDate: [Validators.required(), Validators.futureDate()]
  },

  quickSaleItem: {
    quantity: [Validators.required(), Validators.positive()],
    unitPrice: [Validators.required(), Validators.nonNegative()]
  }
};

// ============================================
// USE FIELD VALIDATION HOOK
// ============================================

/**
 * Hook for single field validation
 */
export function useFieldValidation(validators = []) {
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((value, allValues = {}) => {
    let fieldError = null;
    let fieldWarning = null;

    for (const validator of validators) {
      const result = validator(value, allValues);
      if (result) {
        if (result.severity === ValidationSeverity.ERROR && !fieldError) {
          fieldError = result.message;
        } else if (result.severity === ValidationSeverity.WARNING && !fieldWarning) {
          fieldWarning = result.message;
        }
      }
    }

    setError(fieldError);
    setWarning(fieldWarning);
    return !fieldError;
  }, [validators]);

  const touch = useCallback(() => {
    setTouched(true);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setWarning(null);
    setTouched(false);
  }, []);

  return {
    error: touched ? error : null,
    warning: touched ? warning : null,
    hasError: !!error,
    hasWarning: !!warning,
    touched,
    validate,
    touch,
    reset
  };
}

// ============================================
// USE FORM VALIDATION HOOK
// ============================================

/**
 * Hook for form validation with multiple fields
 */
export function useFormValidation(schema = {}) {
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value, allValues = {}) => {
    const validators = schema[fieldName] || [];
    let fieldError = null;
    let fieldWarning = null;

    for (const validator of validators) {
      const result = validator(value, allValues);
      if (result) {
        if (result.severity === ValidationSeverity.ERROR && !fieldError) {
          fieldError = result.message;
        } else if (result.severity === ValidationSeverity.WARNING && !fieldWarning) {
          fieldWarning = result.message;
        }
      }
    }

    setErrors(prev => ({ ...prev, [fieldName]: fieldError }));
    setWarnings(prev => ({ ...prev, [fieldName]: fieldWarning }));
    return !fieldError;
  }, [schema]);

  const validateAll = useCallback((values) => {
    const newErrors = {};
    const newWarnings = {};
    let isValid = true;

    for (const [fieldName, validators] of Object.entries(schema)) {
      const value = values[fieldName];
      
      for (const validator of validators) {
        const result = validator(value, values);
        if (result) {
          if (result.severity === ValidationSeverity.ERROR && !newErrors[fieldName]) {
            newErrors[fieldName] = result.message;
            isValid = false;
          } else if (result.severity === ValidationSeverity.WARNING && !newWarnings[fieldName]) {
            newWarnings[fieldName] = result.message;
          }
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    // Touch all fields
    const allTouched = Object.keys(schema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    return isValid;
  }, [schema]);

  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const touchAll = useCallback(() => {
    const allTouched = Object.keys(schema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
  }, [schema]);

  const reset = useCallback(() => {
    setErrors({});
    setWarnings({});
    setTouched({});
  }, []);

  const getFieldProps = useCallback((fieldName) => ({
    error: touched[fieldName] && !!errors[fieldName],
    helperText: touched[fieldName] ? (errors[fieldName] || warnings[fieldName]) : undefined,
    onBlur: () => touchField(fieldName)
  }), [touched, errors, warnings, touchField]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(e => !e);
  }, [errors]);

  const hasWarnings = useMemo(() => {
    return Object.values(warnings).some(w => !!w);
  }, [warnings]);

  return {
    errors,
    warnings,
    touched,
    isValid,
    hasWarnings,
    validateField,
    validateAll,
    touchField,
    touchAll,
    reset,
    getFieldProps
  };
}

// ============================================
// USE BUSINESS RULES HOOK
// ============================================

/**
 * Hook for business rule validation
 */
export function useBusinessRules() {
  const [results, setResults] = useState({ errors: [], warnings: [], info: [] });
  const [loading, setLoading] = useState(false);

  const validate = useCallback(async (context, ruleIds = null) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/validation/business-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, ruleIds })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        return result;
      }
    } catch (err) {
      console.error('Business rule validation failed:', err);
    } finally {
      setLoading(false);
    }

    return { valid: true, errors: [], warnings: [], info: [] };
  }, []);

  const clear = useCallback(() => {
    setResults({ errors: [], warnings: [], info: [] });
  }, []);

  return {
    ...results,
    isValid: results.errors.length === 0,
    loading,
    validate,
    clear
  };
}

// ============================================
// USE SCREEN VALIDATION HOOK
// ============================================

/**
 * Hook for validating POS screen data
 */
export function useScreenValidation() {
  const [results, setResults] = useState({ valid: true, errors: [], warnings: [] });
  const [loading, setLoading] = useState(false);

  const validateScreen = useCallback(async (screenId, context) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/validation/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId, context })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        return result;
      }
    } catch (err) {
      console.error('Screen validation failed:', err);
    } finally {
      setLoading(false);
    }

    return { valid: true, errors: [], warnings: [] };
  }, []);

  const clear = useCallback(() => {
    setResults({ valid: true, errors: [], warnings: [] });
  }, []);

  return {
    ...results,
    loading,
    validateScreen,
    clear
  };
}

// ============================================
// USE ORDER VALIDATION HOOK
// ============================================

/**
 * Hook for validating complete orders
 */
export function useOrderValidation() {
  const [results, setResults] = useState({ valid: true, errors: [], warnings: [], canSubmit: true });
  const [loading, setLoading] = useState(false);

  const validateOrder = useCallback(async (order) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/validation/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        return result;
      }
    } catch (err) {
      console.error('Order validation failed:', err);
    } finally {
      setLoading(false);
    }

    return { valid: true, errors: [], warnings: [], canSubmit: true };
  }, []);

  const clear = useCallback(() => {
    setResults({ valid: true, errors: [], warnings: [], canSubmit: true });
  }, []);

  return {
    ...results,
    loading,
    validateOrder,
    clear
  };
}

export default {
  useFieldValidation,
  useFormValidation,
  useBusinessRules,
  useScreenValidation,
  useOrderValidation,
  Validators,
  ValidationSchemas,
  ValidationSeverity
};
