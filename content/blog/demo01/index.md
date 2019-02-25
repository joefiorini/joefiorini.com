---
slug: demo-01
date: 2017-01-01
title: 'Taming Complex State with Union Types'
description: "A common anti pattern I've seen on many projects is having multiple boolean flags on your component's state that control different aspects of the same component (eg. one to track if an alert is shown and another to track if it's dismissed). This post shows one possible way to tame this complexity using TypeScript's union types."
published: true
banner: './banner.png'
---

A common anti pattern I've seen on many projects is having multiple boolean flags on your component's state that control different aspects of the same component. Too vague you say? Let's look at an example.

A common need on web apps is to display an alert on the page confirming an action was sucessful or showing an error message. It's pretty common to track this in state using a boolean flag. Let's consider an example of showing the user a success confirmation.

```typescript
// UsernameForm.tsx
import React from 'react'

function UsernameForm() {
  const [isShowing, setIsShowing] = useState(false)
  const [username, setUsername] = useState('')

  async function saveUsername() {
    await saveUsernameViaApiCall()
    setIsShowing(true)
  }

  return (
    <section>
      <h1>Change Your Username</h1>
      {isShowing ? <Alert>Your username has been updated</Alert> : null}
      <form onSubmit={saveUsername}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            onChange={e => {
              setUsername(e.currentTarget.value)
            }}
          />
        </div>
      </form>
      <button>Save</button>
    </section>
  )
}
```

In the example above we have a form allowing a user to change their username. Upon submission of the form we make an API call to update the username and once that's complete we set the `isShowing` state to `true`. Above the form we display an alert to inform the user that their username was updated successfully. Of course, it won't be long before someone finds a way to make this break. Maybe there's a validation in the API that usernames must be unique. The most typical way I've seen to handle this is to track the status of the alert with state.

```typescript
const [isShowing, setIsShowing] = useState(false)
const [isError, setIsError] = useState(false)

async function saveUsername() {
  try {
    await saveUsernameViaApiCall()
    setIsShowing(true)
  } catch (e) {
    setIsError(true)
  }
}
```

First we add a new state flag called `isError`. Then we set it to true when we catch an error from the API.

```typescript
{
  isShowing ? (
    <Alert status={isError ? 'error' : 'success'}>
      {isError
        ? 'That username is already in use. Please try something different.'
        : 'Your username has been updated.'}
    </Alert>
  ) : null
}
```

Next we use the new `isError` flag twice: once for passing a status to the error component so we can style it appropriately (maybe a red background & icon for error and a green background/icon for success) and for determining what message to show. It won't take long to figure out that this code will only work as long as uniqueness is the only error condition. We know that's not likely the case; what happens if the server is down or there is an unknown error server side? We should probably let the server tell us what the problem is rather than assuming. To do this, we will need to have a contract with how our API returns errors. Let's assume for the moment that in the event of an error our API returns a single string that represents the error that occurred.

```json
{
  "errorMessage": "That username is already in use. Please try something different."
}
```

The example above shows what the error would look like in the case of a non-unique username. We can now use the presence of an error message string to determine if there's an error.

```typescript
const [isShowing, setIsShowing] = useState(false)
const [isError, setIsError] = useState(false)
const [alertMessage, setAlertMessage] = useState('')

async function saveUsername() {
  try {
    const response = await saveUsernameViaApiCall()

    if (response.errorMessage) {
      setAlertMessage(response.errorMessage)
      setIsError(true)
    } else if (response.statusCode >= 500) {
      setAlertMessage(
        'An unknown error occurred trying to update your username. Please try again later.',
      )
      setIsError(true)
    } else {
      setAlertMessage('Your username has been updated.')
    }
    setIsShowing(true)
  } catch (e) {
    setIsError(true)
  }
}
```

Now we are getting the response from our API call and checking for a couple error cases: first we have an `errorMessage` then we track it in our component's state, otherwise we set the message to our success message. Now when we display the alert we can use the alert message from state.

```typescript
isShowing ? (
  <Alert status={isError ? 'error' : 'success'}>{alertMessage}</Alert>
) : null
```

That simplifies the code for showing the alert quite nicely. We deploy this to production and our users are now able to change their username and know if it worked or not. Hurrah.

Then the feedback starts coming in. Product learns that users want to be able to dismiss this alert. Of course, our product manager wants to see how many users actually click the "close" button to dismiss it, therefore we need to track the number of times it's clicked. There are a number of ways to accomplish this (which are outside the scope of this post) but after careful consideration our team decides that we should track dismissed as another state of the alert, that way we can use a background script in a worker to periodically communicate this property to our analytics tracking tool. So we add another value to be tracked in our state.

```typescript
function UsernameForm() {
  const [isShowing, setIsShowing] = useState(false)
  const [isError, setIsError] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [isDimissed, setIsDismissed] = useState(false)

  const closeAlert = () => {
    setIsShowing(false)
    setIsDimissed(true)
  }

  async function saveUsername() {
    try {
      const response = await saveUsernameViaApiCall()

      if (response.errorMessage) {
        setAlertMessage(response.errorMessage)
        setIsError(true)
      } else {
        setAlertMessage('Your username has been updated.')
      }
      setIsShowing(true)
    } catch (e) {
      setIsError(true)
    }
  }

  return (
    <section>
      <h1>Change Your Username</h1>
      {isShowing && !isDismissed ? (
        <Alert status={isError ? 'error' : 'success'} onClose={closeAlert}>
          {alertMessage}
        </Alert>
      ) : null}
      <form onSubmit={saveUsername}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            onChange={e => {
              setUsername(e.currentTarget.value)
            }}
          />
        </div>
      </form>
      <button>Save</button>
    </section>
  )
}
```

Here we've added a callback to our `Alert` component to notify us when the close button is clicked. Then we call a `closeAlert` function that sets both `isShowing` and `isDimsissed` to make the alert go away.

This is a relatively simple example, but hopefully it's clear how it's already starting to grow in complexity. Every time we display an alert we have to remember to set 3 state values and when it's closed we have to set two of them. However, all of these values are tightly coupled: ie. anytime `isError` is `true`, `isShowing` is also `true`; `isShowing` and `isDimsissed` are mutually exclusive, they should never be true at the same time.

Looking at the code it's very easy to accidentally introduce a very subtle bug. Thanks to the compound condition for showing the alert (`isShowing && !isDismissed`), if we don't reset `isShowing` to `false` when closing the alert, it will still go away like we want it to. It's not too far-fetched, therefore, to imagine someone doing some refactoring on this component and removing the `setIsShowing(false)` line, since technically it's not needed. Months later imagine that another developer is fixing a bug and introduces some code to reset `isDismissed` before showing the alert again. Because `isShowing` was never reset to `false` the alert is now both showing and dismissed at the same time. Contradictory states like this make for great physics experiments, but are a few of the thousand paper cuts that can make large codebases very difficult and expensive to maintain.

How do you avoid this situation? We started out with something very simple, but as our requirements got more complex we brought that complexity into our code. While at first glance this solution may not seem complex keep in mind that some synonyms of simple are "clear" and "understandable". The way that this solution hides such an important relationship between these values makes it not simple. The way to avoid it is to refactor the moment you notice the complexity starting to creep in.

We've now arrived at the big question: how do we model this state in such a way that we make unexpected states impossible and still meet the requirements? What if we consolidate the 3 boolean flags into a single string called `alertStatus` with possible values of `"not_shown"`, `"success"`, `"error"` and `"dismissed"`?

```typescript
function UsernameForm() {
  const [alertStatus, setAlertStatus] = useState('not_shown')
  const [alertMessage, setAlertMessage] = useState('')

  async function saveUsername() {
    try {
      const response = await saveUsernameViaApiCall()

      if (response.errorMessage) {
        setAlertMessage(response.errorMessage)
        setAlertStatus('error')
      } else {
        setAlertMessage('Your username has been updated.')
        setAlertStatus('success')
      }
    } catch (e) {
      setAlertMessage(
        'An unknown error occurred trying to update your username. Please try again later.',
      ),
        setAlertStatus('error')
    }
  }

  return (
    <section>
      <h1>Change Your Username</h1>
      {alertStatus !== 'not_shown' && alertStatus !== 'dismissed' ? (
        <Alert
          status={alertStatus}
          onClose={() => {
            setAlertStatus('dismissed')
          }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      <form onSubmit={saveUsername}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            onChange={e => {
              setUsername(e.currentTarget.value)
            }}
          />
        </div>
      </form>
      <button>Save</button>
    </section>
  )
}
```

By consolidating these flags we made it impossible for the alert to be in two different states at once. We've also cut the number of values needed to show an alert down by a third, making it much less likely that someone will forget to set all the necessary values before rendering with the alert.

### The Cat is Still Dead

We may have eliminated the contradictory states from our code, but there's still a problem. Since we're using strings for our `alertStatus` it's very easy to set it to an invalid value; there's nothing stopping someone from calling `setAlertStatus("cat")` and causing the alert to display wrong. Thanks to the dynamic nature of JavaScript without implementing extra conditions around the `Alert` component, there is no absolute way to prevent this. You _could_ use React's `prop-types` library to emit a warning in the browser when it receives an invalid value for `status`. However, in my experience prop type warnings are often ignored; you can configure a [test suite to fail on invalid prop type warnings](https://www.npmjs.com/package/jest-prop-type-error), or make sure everyone has eslint integration in their editor and use the [React eslint plugin](https://github.com/yannickcr/eslint-plugin-react) to validate prop types where possible.

### The TypeScript Solution

If you want a more foolproof way to help your team members (and, very likely your future self) use your code correctly, TypeScript provides a couple features that when used together provide a great defense against invalid states.

#### A Brief Sidetrack into Type Aliases & String Literal Types

##### Type Aliases

> Type aliases create a new name for a type.
> – <cite>[TypeScript Handbook: Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases)</cite>

For example, you might rename the `string` type to `ID` to show that a specific string represents a unique identifier for a record.

```typescript
type ID = string
```

##### String Literal Types

> String literal types allow you to specify the exact value a string must have.
> – <cite>[TypeScript Handbook: Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#string-literal-types)</cite>

```typescript
const message = 'Hello world'
```

In the above example it may look like `message` is going to have the type `string`, but if you look at it in an editor that has good TypeScript support, it actually has the type `"Hello world"`. This is an example of a string literal type. In this case the type is inferred because of the initial value of this string, but since string literal types are types, you can use type aliases to make them reusable.

```typescript
type Message = 'Hello world'

const message: Message = 'blah'
```

[View on TypeScript Playground](https://www.typescriptlang.org/play/index.html#src=type%20Message%20%3D%20'Hello%20world'%0D%0A%0D%0Aconst%20message%3A%20Message%20%3D%20'blah')

Using the link above you can see that assigning `message` with a literal value other than `"Hello World"` gives a compile error, thus allowing you to limit strings to a specific possible value.

You may be wondering at this point how these features will help us with our alert example. We have seen how to enforce a single string value using a type, but our example has four mutually exclusive values. What we need is a way to enforce one of a number of values. And that is where union types come in.

##### Introducing Union Types

> A union type describes a value that can be one of several types. We use the vertical bar (|) to separate each type, so `number | string | boolean` is the type of a value that can be a number, a string, or a boolean.
> – <cite>[TypeScript Handbook: Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types)</cite>

There has already been [a lot][1] [of explanation][2] [around][3] [union types in JavaScript][4]. If you're interested in discussion of the theory behind union types I recommend [this overview of union type implementations in various languages][4][^1]. Let's look a quick example of using union types and then we'll get back to our regularly scheduled topic.

Imagine a function called `padLeft` that pads a string with either a particular character or a number of spaces.

```typescript
padLeft('example', 5) // => "     example"
padLeft('example', '?') // => "?example"
```

We have two different type signatures for this function, one that takes a `string` and a `number` and another that takes two `string`s. You could also say that it has a single type signature: it takes a `string` and a parameter that is either a `string` OR a `number`. That second parameter represents a union type.

```typescript
function padLeft(value: string, padding: string | number) {
  // ...
}
```

You can use any valid TypeScript types as parts of a union type: records, arrays, functions, strings, numbers, even string literal types – the very thing we need for our alert!

#### Back to Our Example

Getting back to our alert example, we now know that we can combine type aliases, string literal types & union types to ensure our component never gets in an invalid state.

```typescript
// Alert.tsx

export type AlertStatus = 'not_shown' | 'success' | 'error' | 'dismissed'

function Alert({ status, message }: { status: AlertStatus; message: string }) {
  return <div className={`alert alert--${status}`}>{message}</div>
}

export default Alert
```

Here we create a basic `Alert` compnonent that takes a prop called `status` of type `AlertStatus`; it can have four possible values and by separating them with `|` we create a union type that can only ever be one of the four values. We use the status to determine a CSS class for the alert. We've also changed the interface slightly to make the TypeScript easier to undertand: it also takes a `message` prop of type `string` and displays it inside the `div`. Note that we're also exporting the `AlertStatus` type; this makes it usable elsewhere.

```typescript
// UsernameForm.tsx
import Alert, { AlertStatus } from './Alert'

function UsernameForm() {
  const [alertStatus, setAlertStatus] = useState('not_shown' as AlertStatus)
  const [alertMessage, setAlertMessage] = useState('')

  async function saveUsername() {
    try {
      const response = await saveUsernameViaApiCall()

      if (response.errorMessage) {
        setAlertMessage(response.errorMessage)
        setAlertStatus('error')
      } else {
        setAlertMessage('Your username has been updated.')
        setAlertStatus('success')
      }
    } catch (e) {
      setAlertMessage(
        'An unknown error occurred trying to update your username. Please try again later.',
      ),
        setAlertStatus('error')
    }
  }

  return (
    <section>
      <h1>Change Your Username</h1>
      {alertStatus !== 'not_shown' && alertStatus !== 'dismissed' ? (
        <Alert
          status={alertStatus}
          onClose={() => {
            setAlertStatus('dismissed')
          }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      <form onSubmit={saveUsername}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            onChange={e => {
              setUsername(e.currentTarget.value)
            }}
          />
        </div>
      </form>
      <button>Save</button>
    </section>
  )
}
```

Now we're using the `AlertStatus` type in our `UsernameForm` component. The only change we needed to make is to add a [type assertion](https://www.typescriptlang.org/docs/handbook/basic-types.html#type-assertions). This provides a hint to the TypeScript compiler that we expect `useState` to deal with `AlertStatus` types.

Now if we try to call `setAlertStatus` with a value that it doesn't explicitly support (ie. `"warning"`) we'll get a compiler error when trying to build the code. However, the code sent to the browser will be relatively the same as what we wrote (save for standard Babel transformations) – TypeScript will remove the type declarations and assertions and we're left the confidence that our code will work as expected.

### Wrapping Up

In this post we've looked at a way to simplify a common example of complexity in React state using TypeScript's union types. I'm including some links at the end that provide options for runtime union types if you can't (or don't want to) use TypeScript (I highly recommend trying it if you haven't; it takes a little getting used to but types allow for an expressiveness & level of safety in your code you simply can't get otherwise). The example in this article was built easily illustrate the problem quickly, but if you are a large codebase that is challenging to maintain you will likely find this anti-pattern in many places. The key to fighting complexity is to refactor as soon as you see it coming. I hope that this article helps prime your intuition so you notice when your state is becoming complex before it's too late.

[^1]:

  If you look at some of those links you will find that there are library implementations in JavaScript that provide union types without using TypeScript. I prefer the TypeScript approach since it provides great build-time power without the need for additional code at runtime.

[1]: https://dev.to/avalander/union-types-with-javascript-4emo
[2]: https://medium.com/@justintormey/write-beautiful-js-with-union-types-ddd11e5e9241
[3]: https://medium.com/fullstack-academy/better-js-cases-with-sum-types-92876e48fd9f
[4]: https://github.com/paldepind/union-type
