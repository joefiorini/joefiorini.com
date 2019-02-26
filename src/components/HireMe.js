import React from 'react'
import config from '../../config/website'
import { OutboundLink } from 'gatsby-plugin-google-analytics'

function HireMe() {
  return (
    <div>
      <h2>Did you find this advice helpful?</h2>
      <h3>Hire me to help you tame the complexity of your React apps</h3>
      <p>
        I've worked in with teams and codebases of all sizes at all stages of a
        project.{' '}
        <OutboundLink href="https://calendly.com/joe-fiorini">
          Let's set up a time to chat about your project
        </OutboundLink>{' '}
        and see if there's anywhere I can help out!
      </p>
      <h3>I'd like to hear your thoughts</h3>
      <p>
        Find me on <a href={config.twitter}>Twitter</a> and let's talk.
      </p>
    </div>
  )
}

export default HireMe
