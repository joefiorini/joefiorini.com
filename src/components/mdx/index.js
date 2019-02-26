import React from 'react'

import Title from './Title'
import Subtitle from './Subtitle'
import Paragraph from './Paragraph'
import Code from './Code'
import { preToCodeBlock } from 'mdx-utils'

export default {
  h1: props => <Title {...props} />,
  h2: props => <Subtitle {...props} />,
  p: props => <Paragraph {...props} />,
  pre: preProps => {
    const props = preToCodeBlock(preProps)

    // TODO: Remove once https://github.com/ChristopherBiscardi/gatsby-mdx/issues/300 gets fixed
    props.codeString = props.codeString.replace(
      /(\n+)_export(\s)/g,
      '$1export$2',
    )

    // if there's a codeString and some props, we passed the test
    if (props) {
      return <Code {...props} />
    } else {
      // it's possible to have a pre without a code in it
      return <pre {...preProps} />
    }
  },
}
