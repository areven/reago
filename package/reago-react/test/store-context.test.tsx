// =============================================================================
// Store context tests
// =============================================================================

import {useEffect} from 'react';
import {atomAction, atomState, createStore, getDefaultStore, type Store} from 'reago';
import {StoreProvider, useAtom, useDispatchAtom, useReadAtom, useStore} from 'reago-react';
import {expect, test} from 'vitest';
import {render} from 'vitest-browser-react';


test('useStore() without a store provider returns the default store', () => {
  let returnedStore1: Store | null = null;
  let returnedStore2: Store | null = null;

  function Component() {
    const store1 = useStore();
    const store2 = useStore();
    returnedStore1 = store1;
    returnedStore2 = store2;
    return null;
  }

  render(<Component/>);
  expect(returnedStore1).toBe(getDefaultStore());
  expect(returnedStore2).toBe(getDefaultStore());
});

test('useStore() with a default store provider returns a custom store', () => {
  let returnedStore1: Store | null = null;
  let returnedStore2: Store | null = null;

  function Component() {
    const store1 = useStore();
    const store2 = useStore();
    returnedStore1 = store1;
    returnedStore2 = store2;
    return null;
  }

  render(
    <StoreProvider>
      <Component/>
    </StoreProvider>
  );
  expect(returnedStore1).not.toBe(getDefaultStore());
  expect(returnedStore2).not.toBe(getDefaultStore());
});

test('useStore() with a custom store provider returns the provided store', () => {
  let returnedStore1: Store | null = null;
  let returnedStore2: Store | null = null;

  function Component() {
    const store1 = useStore();
    const store2 = useStore();
    returnedStore1 = store1;
    returnedStore2 = store2;
    return null;
  }

  const store = createStore();
  render(
    <StoreProvider store={store}>
      <Component/>
    </StoreProvider>
  );

  expect(returnedStore1).toBe(store);
  expect(returnedStore2).toBe(store);
});

test('useStore() outside of a store provider returns the default store', () => {
  let returnedStore1: Store | null = null;
  let returnedStore2: Store | null = null;

  function Component() {
    const store1 = useStore();
    const store2 = useStore();
    returnedStore1 = store1;
    returnedStore2 = store2;
    return null;
  }

  const store = createStore();
  render(
    <div>
      <StoreProvider store={store}>
        <div>nope</div>
      </StoreProvider>
      <Component/>
    </div>
  );

  expect(returnedStore1).toBe(getDefaultStore());
  expect(returnedStore2).toBe(getDefaultStore());
});

test('useStore() used with nested store providers returns the closest provided store', () => {
  let returnedStore1: Store | null = null;
  let returnedStore2: Store | null = null;

  function Component() {
    const store1 = useStore();
    const store2 = useStore();
    returnedStore1 = store1;
    returnedStore2 = store2;
    return null;
  }

  const store1 = createStore();
  const store2 = createStore();
  render(
    <StoreProvider store={store1}>
      <StoreProvider store={store2}>
        <Component/>
      </StoreProvider>
    </StoreProvider>
  );

  expect(returnedStore1).toBe(store2);
  expect(returnedStore2).toBe(store2);
});

test('useAtom() uses the provided store', async () => {
  const store1 = getDefaultStore();
  const store2 = createStore();
  const store3 = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component({testId, newValue}: {testId: number, newValue: number}) {
    const [value, dispatch] = useAtom($atom);
    useEffect(() => {
      dispatch(newValue);
    }, [newValue]);
    return <div data-testid={'test-' + testId}>{value}</div>;
  }

  const screen = render(
    <>
      <StoreProvider store={store2}><Component testId={2} newValue={42}/></StoreProvider>
      <Component testId={1} newValue={169}/>
      <StoreProvider store={store3}><Component testId={3} newValue={83}/></StoreProvider>
    </>
  );

  await expect.element(screen.getByTestId('test-1')).toHaveTextContent('169');
  await expect.element(screen.getByTestId('test-2')).toHaveTextContent('42');
  await expect.element(screen.getByTestId('test-3')).toHaveTextContent('83');
});

test('useReadAtom() uses the provided store', async () => {
  const store1 = getDefaultStore();
  const store2 = createStore();
  const store3 = createStore();

  let counter = 0;
  function $atom() {
    return ++counter;
  }

  store1.read($atom);
  store2.read($atom);
  store3.read($atom);

  function Component({testId}: {testId: number}) {
    const value = useReadAtom($atom);
    return <div data-testid={'test-' + testId}>{value}</div>
  }

  const screen = render(
    <>
      <Component testId={1}/>
      <StoreProvider store={store2}><Component testId={2}/></StoreProvider>
      <StoreProvider store={store3}><Component testId={3}/></StoreProvider>
    </>
  );

  const result1 = screen.getByTestId('test-1');
  await expect.element(result1).toHaveTextContent('1');

  const result2 = screen.getByTestId('test-2');
  await expect.element(result2).toHaveTextContent('2');

  const result3 = screen.getByTestId('test-3');
  await expect.element(result3).toHaveTextContent('3');
});

test('useDispatchAtom() uses the provided store', async () => {
  const store1 = getDefaultStore();
  const store2 = createStore();
  const store3 = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component({newValue}: {newValue: number}) {
    const updateAtom = useDispatchAtom($atom);
    useEffect(() => {
      updateAtom(newValue);
    }, [newValue]);
    return <div>{newValue}</div>;
  }

  const screen = render(
    <>
      <StoreProvider store={store2}><Component newValue={42}/></StoreProvider>
      <Component newValue={169}/>
      <StoreProvider store={store3}><Component newValue={83}/></StoreProvider>
    </>
  );

  await expect.element(screen.getByText('42')).toBeInTheDocument();
  await expect.element(screen.getByText('169')).toBeInTheDocument();
  await expect.element(screen.getByText('83')).toBeInTheDocument();

  expect(store1.read($atom)).toBe(169);
  expect(store2.read($atom)).toBe(42);
  expect(store3.read($atom)).toBe(83);
});
