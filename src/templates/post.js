import { css } from '@emotion/core'
import Container from 'components/Container'
import SEO from 'components/SEO'
import { graphql } from 'gatsby'
import Img from 'gatsby-image'
import MDXRenderer from 'gatsby-mdx/mdx-renderer'
import { OutboundLink } from 'gatsby-plugin-google-analytics'
import React from 'react'
import config from '../../config/website'
import Layout from '../components/Layout'
import Aside from '../components/mdx/Aside'
import Share from '../components/Share'
import { YouTube } from '../components/Social'
import { bpMaxSM } from '../lib/breakpoints'
import { fonts } from '../lib/typography'

export default function Post({
  data: { site, mdx },
  pageContext: { next, prev },
}) {
  // const author = mdx.frontmatter.author || config.author
  console.log(mdx.frontmatter)
  const date = mdx.frontmatter.date
  const title = mdx.frontmatter.title
  const banner = mdx.frontmatter.banner
  const videoUrl = mdx.frontmatter.video_url
  const videoTeaser = mdx.frontmatter.video_teaser

  return (
    <Layout site={site} frontmatter={mdx.frontmatter}>
      <SEO frontmatter={mdx.frontmatter} isBlogPost />
      <article
        css={css`
          width: 100%;
          display: flex;
        `}
      >
        <Container>
          <h1
            css={css`
              text-align: center;
              margin-bottom: 20px;
            `}
          >
            {title}
          </h1>
          <div
            css={css`
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
              h3,
              span {
                text-align: center;
                font-size: 15px;
                opacity: 0.6;
                font-family: ${fonts.regular}, sans-serif;
                font-weight: normal;
                margin: 0 5px;
              }
            `}
          >
            {/* {author && <h3>{author}</h3>} */}
            {/* {author && <span>—</span>} */}
            {date && <h3>{date}</h3>}
          </div>
          {banner && (
            <div
              css={css`
                padding: 30px;
                ${bpMaxSM} {
                  padding: 0;
                }
              `}
            >
              <Img
                sizes={banner.childImageSharp.fluid}
                alt={site.siteMetadata.keywords.join(', ')}
              />
            </div>
          )}
          <br />
          {videoUrl ? (
            <Aside>
              <h3
                css={css`
                  display: flex;
                  align-items: center;
                `}
              >
                <div
                  css={css`
                    line-height: 0;
                    display: inline-block;
                    margin-right: 8px;
                  `}
                >
                  <YouTube url={videoUrl} />
                </div>{' '}
                This post has a companion video
              </h3>
              {videoTeaser ? <p>{videoTeaser}</p> : null}
              <p
                css={css`
                  margin-bottom: 0;
                `}
              >
                <OutboundLink href={videoUrl}>Watch the video</OutboundLink>
              </p>
            </Aside>
          ) : null}
          <MDXRenderer>{mdx.code.body}</MDXRenderer>
        </Container>
        {/* <SubscribeForm /> */}
      </article>
      <Container noVerticalPadding>
        <Share
          url={`${config.siteUrl}/${mdx.frontmatter.slug}/`}
          title={title}
          twitterHandle={config.twitterHandle}
        />
        <br />
      </Container>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($id: String!) {
    site {
      ...site
    }
    mdx(fields: { id: { eq: $id } }) {
      frontmatter {
        title
        video_url
        video_teaser
        date(formatString: "MMMM DD, YYYY")
        banner {
          childImageSharp {
            fluid(maxWidth: 900) {
              ...GatsbyImageSharpFluid_withWebp_tracedSVG
            }
          }
        }
        slug
        keywords
      }
      code {
        body
      }
    }
  }
`
