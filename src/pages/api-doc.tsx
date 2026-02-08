import { GetStaticProps, InferGetStaticPropsType } from "next"
import { getApiDocs } from "@/lib/swagger"
import dynamic from "next/dynamic"
import "swagger-ui-react/swagger-ui.css"

const SwaggerUI = dynamic<{ spec: any }>(import("swagger-ui-react"), {
  ssr: false,
})

function ApiDoc({ spec }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <SwaggerUI spec={spec} />
}

export const getStaticProps: GetStaticProps = async () => {
  const spec = await getApiDocs()

  return {
    props: {
      spec,
    },
  }
}

export default ApiDoc
