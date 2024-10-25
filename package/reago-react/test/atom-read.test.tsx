// =============================================================================
// Atom read tests
// =============================================================================

import ReactExports, {useState} from 'react';
import {atomAction, atomState, createStore, deasync, dispatch, invalidate, read} from 'reago';
import {StoreProvider, useReadAtom} from 'reago-react';
import {expect, test, vi} from 'vitest';
import {render} from 'vitest-browser-react'


test('useReadAtom() reads the value of a functional atom', async () => {
  function $atom() {
    return 123;
  }

  function Component() {
    const value = useReadAtom($atom);
    return <div title='result'>{value}</div>;
  }

  const screen = render(<Component/>);
  const result = screen.getByTitle('result');

  await expect.element(result).toHaveTextContent('123');
});

test('useReadAtom() unpacks resolved promises returned from functional atoms', async () => {
  let renderCount = 0;

  function $atom(instance: number) {
    return Promise.resolve('hello world ' + instance);
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom, 42);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('hello world 42');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadAtom() synchronously unpacks known promises returned from functional atoms', async () => {
  let renderCount = 0;
  const returnedPromise = Promise.resolve('a&s');

  deasync(returnedPromise);
  await returnedPromise;

  function $atom() {
    return returnedPromise;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('a&s');
  expect(renderCount).toBe(1);
});

test('useReadAtom() throws on rejected promises returned from functional atoms', async () => {
  let renderCount = 0;

  function $atom() {
    return Promise.reject(new Error('expected'));
  }

  function Component() {
    ++renderCount;
    try {
      useReadAtom($atom);
      throw new Error('failed');
    } catch (err: any) {
      if (err && err.message && err.message === 'expected') {
        return <div data-testid='test'>success</div>;
      } else {
        throw err;
      }
    }
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('success');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadAtom() synchronously throws on known rejected promises returned from functional atoms', async () => {
  let renderCount = 0;
  const returnedPromise = Promise.reject(new Error('expected'));

  deasync(returnedPromise);
  await returnedPromise.catch(() => {});

  function $atom() {
    return returnedPromise;
  }

  function Component() {
    ++renderCount;
    try {
      useReadAtom($atom);
      throw new Error('failed');
    } catch (err: any) {
      if (err && err.message && err.message === 'expected') {
        return <div data-testid='test'>success</div>;
      } else {
        return <div data-testid='test'>fail, suspense triggered</div>;
      }
    }
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('success');
  expect(renderCount).toBe(1);
});

test('useReadAtom() rerenders on changes of a functional atom', async () => {
  let renderCount = 0;

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom)(42);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBe(2);

  invalidate($atom);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBe(2);

  dispatch($atom)(89);
  await expect.element(element).toHaveTextContent('89');
  expect(renderCount).toBe(3);
});

test('useReadAtom() reads the unpacked value of a generative atom', async () => {
  let renderCount = 0;

  function* $atom() {
    yield Promise.resolve(null);
    return 'made it!';
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('made it!');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadAtom() unpacks promises returned from generative atoms', async () => {
  let renderCount = 0;

  function* $atom() {
    yield Promise.resolve(null);
    return Promise.resolve('made it too');
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('made it too');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadAtom() synchronously reads the value of a synchronously computed generative atom', async () => {
  let renderCount = 0;
  const innerPromise = Promise.resolve(456);

  deasync(innerPromise);
  await innerPromise;

  function* $atom() {
    yield innerPromise;
    return 'hi';
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('hi');
  expect(renderCount).toBe(1);
});

test('useReadAtom() rerenders on changes of a generative atom', async () => {
  let renderCount = 0;

  function* $atom() {
    yield Promise.resolve(null);
    const [value, setValue] = atomState(0);
    yield Promise.resolve(true);
    atomAction(setValue, []);
    yield Promise.resolve(false);
    return value;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('0');
  expect(renderCount).toBeLessThanOrEqual(2);

  dispatch($atom)(42);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBeLessThanOrEqual(3);

  invalidate($atom);
  await read($atom);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBeLessThanOrEqual(3);
});

test('useReadAtom() does not rerender if atom is recomputed but its value remains the same', async () => {
  let renderCount = 0;

  function $atom() {
    const [value1, setValue1] = atomState(0);
    const [value2, setValue2] = atomState(0);
    atomAction((n1: number, n2: number) => {
      setValue1(n1);
      setValue2(n2);
    }, []);
    return value1 + value2;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom)(5, 3);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);

  dispatch($atom)(4, 4);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);

  invalidate($atom);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);
});

test('useReadAtom() supports atom families', async () => {
  let renderCount = 0;

  function $atom(instance: string) {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const value1 = useReadAtom($atom, 'first');
    const value2 = useReadAtom($atom, 'second');
    return (
      <>
        <div data-testid={'test-1'}>{value1}</div>
        <div data-testid={'test-2'}>{value2}</div>
      </>
    );
  }

  const screen = render(<Component/>);
  const test1 = screen.getByTestId('test-1');
  const test2 = screen.getByTestId('test-2');

  await expect.element(test1).toHaveTextContent('0');
  await expect.element(test2).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom, 'first')(42);
  dispatch($atom, 'second')(89);

  await expect.element(test1).toHaveTextContent('42');
  await expect.element(test2).toHaveTextContent('89');
  expect(renderCount).toBe(2);

  dispatch($atom, 'third')(124334);

  await expect.element(test1).toHaveTextContent('42');
  await expect.element(test2).toHaveTextContent('89');
  expect(renderCount).toBe(2);
});

test('useReadAtom() can switch from one store to another', async () => {
  const store1 = createStore();
  const store2 = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  store1.dispatch($atom)(42);
  store2.dispatch($atom)(84);

  function Component1() {
    const [firstStore, setFirstStore] = useState(true);
    return (
      <StoreProvider store={firstStore ? store1 : store2}>
        <Component2/>
        <button onClick={() => setFirstStore(false)}>toggle store</button>
      </StoreProvider>
    );
  }

  function Component2() {
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component1/>);
  const test = screen.getByTestId('test');
  const button = screen.getByRole('button');

  await expect.element(test).toBeInTheDocument();
  await expect.element(button).toBeInTheDocument();

  await expect.element(test).toHaveTextContent('42');
  await button.click();
  await expect.element(test).toHaveTextContent('84');
});

test('useReadAtom() can switch from one atom to another', async () => {
  let renderCount = 0;

  function $atom1() {
    return 123;
  }

  function $atom2() {
    return 456;
  }

  function Component1() {
    ++renderCount;
    const [firstAtom, setFirstAtom] = useState(true);
    const value = useReadAtom(firstAtom ? $atom1 : $atom2);
    return (
      <>
        <div data-testid='test'>{value}</div>
        <button onClick={() => setFirstAtom(false)}>toggle atom</button>
      </>
    );
  }

  const screen = render(<Component1/>);
  const test = screen.getByTestId('test');
  const button = screen.getByRole('button');

  await expect.element(test).toBeInTheDocument();
  await expect.element(button).toBeInTheDocument();

  await expect.element(test).toHaveTextContent('123');
  await button.click();
  await expect.element(test).toHaveTextContent('456');
});

test('useReadAtom() preserves the original result reference', async () => {
  const result = {x: 123};
  const $atom = () => result;

  let returnedResult;
  function Component() {
    returnedResult = useReadAtom($atom);
    return null;
  }

  render(<Component/>);
  expect(returnedResult).toBe(result);
});

test('useReadAtom() uses the new `use` from react if available', async () => {
  const hasUse = !!(ReactExports as any).use;

  let mockUse;
  if (hasUse) {
    mockUse = vi.spyOn(ReactExports, 'use' as any);
  } else {
    mockUse = vi.fn();
    (ReactExports as any).use = mockUse;
  }

  mockUse.mockReturnValue(123);

  function $atom() {
    return Promise.resolve(456);
  }

  function Component() {
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const test = screen.getByTestId('test');

  await expect.element(test).toHaveTextContent('123'); // from the mock
  expect(mockUse).toHaveBeenCalledOnce();

  if (hasUse) {
    mockUse.mockRestore();
  } else {
    delete (ReactExports as any).use;
  }
});

test('useReadAtom() throws pending promises if `use` from react is not available', async () => {
  const hasUse = !!(ReactExports as any).use;
  const orgUse = (ReactExports as any).use;
  let caughtSuspense = false;

  if (hasUse) {
    delete (ReactExports as any).use;
  }

  function $atom() {
    return Promise.resolve(456);
  }

  function Component() {
    try {
      useReadAtom($atom);
    } catch (err) {
      caughtSuspense = true;
    }
    return null;
  }

  render(<Component/>);
  expect(caughtSuspense).toBeTruthy();

  if (hasUse) {
    (ReactExports as any).use = orgUse;
  }
});
