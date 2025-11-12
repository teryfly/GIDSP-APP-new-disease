import { useEffect, useState } from 'react';
import { getOptionsBySetName, fetchAllOptionSets } from '../api/optionSets';

export interface OptionMap {
  [key: string]: { id: string; code?: string; name: string }[];
}

export function useBootstrapOptionSets(names: string[]) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<OptionMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await fetchAllOptionSets();
        const results = await Promise.all(names.map((n) => getOptionsBySetName(n)));
        const map: OptionMap = {};
        names.forEach((n, idx) => {
          map[n] = results[idx].map((o) => ({ id: o.id, code: o.code, name: o.displayName || o.name }));
        });
        if (mounted) setOptions(map);
      } catch (e: any) {
        if (mounted) setError(e?.message || '加载值域集失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [names.join('|')]);

  return { loading, options, error };
}