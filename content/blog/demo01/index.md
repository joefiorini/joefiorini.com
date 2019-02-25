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
      {showAlert ? <Alert>Your username has been updated</Alert> : null}
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
  showAlert ? (
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

The example above shows what the error would look like in the case of a non-unique username.
