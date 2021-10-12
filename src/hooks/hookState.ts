import { useState } from 'react';

export default function newHookState(): {getters: any[], setters: {setIsLoading:any, setError: any}} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  return { getters: [isLoading, error], setters: { setIsLoading, setError } };
}
