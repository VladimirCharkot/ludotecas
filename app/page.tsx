"use client"

import Footer from "@/components/footer"
import Header from "@/components/header"
import LinksPortada from "@/components/links"

import { Box, Flex } from "@mantine/core"

export default function Home() {
  return (
    <Flex direction="column" mih="100vh">
      <Header />

      {/* flex={1} forces this container to grow and push the footer down. */}
      <Box component="main" flex={1} p="md" py="xl">
        <LinksPortada />
      </Box>

      <Footer />
    </Flex>
  )
}
