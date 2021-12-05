import React, { useEffect, useState } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
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
beforeEach(() => {
  reset();
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
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
    render(
      <>
        <Component01 />
      </>,
      container
    );
  });
  expect(container.childNodes).toMatchSnapshot();

  unmountComponentAtNode(container);
  container.remove();

  await act(async () => {
    const cache = await getDataFromTree(<Component01 />);
    createCache(cache);
    render(
      <>
        <Component01 />
      </>,
      container
    );
  });
  expect(container.childNodes).toMatchSnapshot();

  unmountComponentAtNode(container);
  container.remove();

  await act(async () => {
    const cache = await getDataFromTree(<></>);
    expect(cache).toMatchSnapshot();
    createCache(cache);
    render(
      <>
        <Component01 />
        <Component02 />
      </>,
      container
    );
    await new Promise((r) => setTimeout(r, 100));
  });
  expect(container.childNodes).toMatchSnapshot();
  unmountComponentAtNode(container);
  container.remove();

  await act(async () => {
    const cache = await getDataFromTree(
      <>
        <Component01 />
        <Component02 />
      </>
    );
    expect(cache).toMatchSnapshot();
    createCache(cache);
    render(
      <>
        <Component01 />
        <Component02 />
      </>,
      container
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});

it('SSR', async () => {
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
    render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>,
      container
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});

it('Context', async () => {
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
    render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
      </>,
      container
    );
    await new Promise((r) => setTimeout(r, 100));
  });

  expect(container.childNodes).toMatchSnapshot();
});
it('Clear', async () => {
  (process as { browser?: boolean }).browser = true;
  const value = createContextCache([[['@react-libraries/use-ssr', 'Component', '02'], 1000]]);
  createCache(value);
  await act(async () => {
    render(
      <>
        <Component03 />
      </>,
      container
    );
  });
  expect(container).toMatchSnapshot();
});
it('Clear2', async () => {
  (process as { browser?: boolean }).browser = true;
  const value = createContextCache([[['@react-libraries/use-ssr', 'Component', '02'], 1000]]);
  createCache(value);
  clearCache();
  clearCache('Component');
  clearCache(['Component', '02']);
  await act(async () => {
    render(
      <>
        <Component03 />
      </>,
      container
    );
  });
  expect(container).toMatchSnapshot();
});

it('Mutation-Query', async () => {
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
    render(
      <>
        <Component01 />
        <Component02 />
        <Component03 />
        <Component04 />
      </>,
      container
    );
    await new Promise((r) => setTimeout(r, 1000));
  });
  expect(container.childNodes).toMatchSnapshot();
});
