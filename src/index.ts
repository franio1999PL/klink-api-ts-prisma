import { ModifiedDataTypes } from '../types.d'
import express from 'express'
import cors from 'cors'
import GetPocket from './getPocket'
import { PrismaClient, Prisma } from '@prisma/client'
import { Resend } from 'resend'
import dotenv from 'dotenv'
import { PocketParams } from '../types'

// Prisma and Resend initialization
const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_TOKEN)

dotenv.config()

const app = express()
app.use(cors())

// Setup config for connection with getpocket api
const pocketConfig = {
  consumerKey: process.env.POCKET_CONSUMER_KEY || '',
  accessKey: process.env.POCKET_ACCESS_KEY || ''
}

app.get('/', async (req, res) => {
  // GetPocket API connection to retrieve posts
  const getDataFromPocket = async (
    consumer_key: string,
    access_token: string
  ) => {
    console.log('starting getpocket function...')
    const pocket = new GetPocket({
      consumer_key,
      access_token
    })

    const params: PocketParams = {
      favorite: 1,
      count: 1000,
      sort: 'newest',
      detailType: 'complete'
    }

    await pocket.get(params, async (err: any, response: any) => {
      if (err) {
        console.log(err.message)
        try {
          const data = await resend.emails.send({
            from: 'notification@blady.dev',
            to: 'sikorafranek@gmail.com',
            subject: 'Knotz.link api error',
            html: `<strong>Error with pocket connection!</strong> Error log: ${err}`
          })
          console.log(data)
          return
        } catch (err: any) {
          console.log('We cant send notification with error' + err)
        }
      }
      const posts: Promise<ModifiedDataTypes> = response.list

      const postsFromPocketApi = Object.values(posts).map(
        ({
          item_id: id,
          given_url: url,
          resolved_title: title,
          excerpt: description,
          time_favorited: time_added,
          //   time_to_read: read_time,
          word_count,
          tags
        }) => ({
          id,
          url,
          title,
          description,
          time_added,
          word_count,
          tags: tags && Object.keys(tags).length > 0 ? tags : {}
        })
      )

      const savePostWithTags = async () => {
        const items = await prisma.item.createMany({
          data: postsFromPocketApi,
          skipDuplicates: true
        })

        console.log(items)
      }
      savePostWithTags()

      console.log(postsFromPocketApi.length)
      res.send(postsFromPocketApi)
    })
  }
  getDataFromPocket(pocketConfig.consumerKey, pocketConfig.accessKey)
})

app.get('/posts', async (req, res) => {
  try {
    const data = await prisma.item.findMany()
    console.log(data.length)
    res.send(data)
  } catch (error: any) {
    res.send({
      code: 501,
      message: error.message
    })
  }
})

app.get('/tag', async (req, res) => {
  const tag = req.query.tag
  console.log(tag)

  try {
    const data = await prisma.item.findMany()

    const searchByTag = (data: any, tag: any) => {
      const filteredData = data.filter((item: any) => {
        return item.tags && item.tags[tag]
      })
      return filteredData
    }

    const itemsWithTag = searchByTag(data, tag)

    res.send(itemsWithTag)
  } catch (error: any) {
    res.send({
      code: 501,
      message: error.message
    })
  }
})

app.get('/tags', async (req, res) => {
  try {
    const data = await prisma.item.findMany()
    const getAllTags = (data: any) => {
      console.log(data)
      const tagsSet = new Set()

      for (const item of data) {
        const tags = item.tags

        if (tags && Object.keys(tags).length > 0) {
          for (const tagKey in tags) {
            const tag = tags[tagKey].tag
            tagsSet.add(tag)
          }
        }
      }

      return Array.from(tagsSet)
    }

    const tags = await getAllTags(data)
    res.send(tags)
  } catch (error: any) {
    res.send({ code: 501, error: error.message })
    console.log(error)
  }
})

app.get('/delete', async (req, res) => {
  try {
    const deletePosts = async () => {
      await prisma.item.deleteMany()
    }
    deletePosts()
    res.send({ msg: 'Posts and tags deleted successfully' })
  } catch (error: any) {
    res.send({ msg: error.message })
  }
})

app.listen(3000)
