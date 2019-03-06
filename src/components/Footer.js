import { css } from '@emotion/core'
import React from 'react'
import { bpMaxSM } from '../lib/breakpoints'
import Container from './Container'
import SubscribeForm from './Forms/Subscribe'
import HireMe from './HireMe'
import { GitHub, LinkedIn, Twitter, YouTube } from './Social'

const Footer = ({ author, noSubscribeForm, isPost }) => (
  <footer>
    <Container
      css={css`
        padding-top: 0;
        ${bpMaxSM} {
          padding-top: 0;
        }
      `}
    >
      {!noSubscribeForm && (
        <div>
          {isPost && <HireMe />}
          <SubscribeForm />
          <br />
          <br />
        </div>
      )}
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <div
          css={css`
            font-size: 90%;
            opacity: 0.7;
          `}
        >
          {author && `${author} \u00A9 ${new Date().getFullYear()}`}
        </div>
        <div>
          <Twitter />
          <GitHub />
          <LinkedIn />
          <YouTube />
        </div>
      </div>
    </Container>
  </footer>
)

export default Footer
