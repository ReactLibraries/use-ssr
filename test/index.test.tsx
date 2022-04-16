import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { reset } from '@react-libraries/use-global-state';
import {
  clearCache,
  createCache,
  getDataFromTree,
  useMutation,
  useQuery,
  useSSR,
  createContextCache,
} from '../src';
let container: HTMLElement;
let prev;
beforeEach(() => {
  reset();
  container = document.createElement('div');
  prev = global.IS_REACT_ACT_ENVIRONMENT;
  global.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  container.remove();
  global.IS_REACT_ACT_ENVIRONMENT = prev;
});

const Component01 = () => {
  const [count, setCount] = useState(0);
  const [state, setState] = useSSR<number>('Component01', async (state, setState) => {
    if (state === 100) return;
    setState(10);
    setCount((v) => v + 1);
    setState(100);
  });
  useEffect(() => {
    setState(200);
  }, []);
  return <>{[state, count].join(',')}</>;
};
const Component02 = () => {
  const [count, setCount] = useState(0);
  const [state, setState] = useSSR<number>(['Component', '02'], async (state, setState) => {
    if (state !== undefined) return;
    await new Promise((resolve) =>
      setTimeout(() => {
        setState(10);
        resolve(undefined);
      }, 0)
    );
    await new Promise((resolve) => setTimeout(resolve, 1));
    await new Promise((resolve) =>
      setTimeout(() => {
        setState(100);
        resolve(undefined);
      }, 0)
    );
    setCount((v) => v + 1);
  });
  useEffect(() => {
    setState(undefined);
  }, []);
  return <>{[state, count].join(',')}</>;
};
const Component03 = () => {
  const [state] = useSSR<number>(['Component', '02']);
  return <>{[state]}</>;
};

const Component04 = () => {
  const query = useQuery();
  const dispatch = useMutation();
  useEffect(() => {
    setTimeout(() => dispatch('Component01', 123), 10);
    setTimeout(() => dispatch(['Component', '02'], 123), 10);
  }, []);
  return <>{[query('Component01'), query(['Component', '02'])].join(',')}</>;
};

it('Client', async () => {
  await act(async () => {
    const cache = await getDataFromTree(<Component01 />);
    expect(cache).toMatchSnapshot();
  });
  let root = createRoot(container);
  await act(async () => {
    root.render(
      <>
        <Component01 />
      </>
    );
  });
  expect(container.childNodes).toMatchSnapshot();
  await act(() => {
    root.unmount();
  });
  root = createRoot(container);
  await act(async () => {
    const cache = await getDataFromTree(<Component01 />);
    createCache(cache);
    root.render(
      <>
        <Component01 />
      </>
    );
  });
  expect(container.childNodes).toMatchSnapshot();

  await act(() => {
    root.unmount();
  });
  root = createRoot(container);
  await act(async () => {
    const cache = await getDataFromTree(<></>);
    expect(cache).toMatchSnapshot();
    createCache(cache);
    root.render(
      <>
        <Component01 />
        <Component02 />
      </>
    );
    await new Promise((r) => setTimeout(r, 100));
  });
  expect(container.childNodes).toMatchSnapshot();
  await act(() => {
    root.unmount();
  });
  root = createRoot(container);
  await act(async () => {
    const cache = await getDataFromTree(
      <>
        <Component01 />
        <Component02 />
      </>
    );
    expect(cache).toMatchSnapshot();
    createCache(cache);
    root.render(
      <>
        <Component01 />
        <Component02 />
      </>
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});

it('SSR', async () => {
  const root = createRoot(container);
  (process as { browser?: boolean }).browser = false;
  await act(async () => {
    const cache = await getDataFromTree(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>
    );
    expect(cache).toMatchSnapshot();
    createCache(cache);
    root.render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});

it('Context', async () => {
  const root = createRoot(container);
  (process as { browser?: boolean }).browser = false;
  await act(async () => {
    const value = createContextCache([[['@react-libraries/use-ssr', 'Component', '02'], 1000]]);
    const cache = await getDataFromTree(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>,
      value
    );
    expect(cache).toMatchSnapshot();
    createCache(cache);
    root.render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});
it('Clear', async () => {
  const root = createRoot(container);
  (process as { browser?: boolean }).browser = true;
  const value = createContextCache([[['@react-libraries/use-ssr', 'Component', '02'], 1000]]);
  createCache(value);
  await act(async () => {
    root.render(
      <>
        <Component03 />
      </>
    );
  });
  expect(container).toMatchSnapshot();
});
it('Clear2', async () => {
  const root = createRoot(container);
  (process as { browser?: boolean }).browser = true;
  const value = createContextCache([[['@react-libraries/use-ssr', 'Component', '02'], 1000]]);
  createCache(value);
  clearCache();
  clearCache('Component');
  clearCache(['Component', '02']);
  await act(async () => {
    root.render(
      <>
        <Component03 />
      </>
    );
  });
  expect(container).toMatchSnapshot();
});

it('Mutation-Query', async () => {
  const root = createRoot(container);
  (process as { browser?: boolean }).browser = true;
  await act(async () => {
    const cache = await getDataFromTree(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
        <Component04 />
      </>
    );
    expect(cache).toMatchSnapshot();
    createCache(cache);
    root.render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
        <Component04 />
      </>
    );
    await new Promise((r) => setTimeout(r, 1000));
  });
  expect(container.childNodes).toMatchSnapshot();
});
