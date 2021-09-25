import React, { useEffect, useState } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { reset } from '@react-libraries/use-global-state';
import { createCache, getDataFromTree, useSSR } from '../src';

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
  return <>{[state, count]}</>;
};
const Component02 = () => {
  const [count, setCount] = useState(0);
  const [state, setState] = useSSR<number>(['Component', '02'], async (state, setState) => {
    if (state !== undefined) return;
    setState(10);
    await new Promise((resolve) => setTimeout(resolve, 1));
    setState(100);
    setCount((v) => v + 1);
  });
  useEffect(() => {
    setState(undefined);
  }, []);
  return <>{[state, count]}</>;
};
const Component03 = () => {
  const [state] = useSSR<number>(['Component', '02']);
  return <>{[state]}</>;
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
  (process as { browser?: boolean }).browser = true;
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
