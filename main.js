import dotenv from 'dotenv'
import { Client, IntentsBitField } from 'discord.js'
import { Configuration, OpenAIApi } from 'openai'

import { prefix, suffix } from './src/configs/presuffix.js'

dotenv.config()

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ]
})

const openAiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(openAiConfig)

client.on('ready', () => {
  console.log('Hola señor Stark')
})

client.on('messageCreate', async (message) => {
  // Author of the message is not a bot
  if (message.author.bot) return
  // The message is sent on the assigned channel
  if (message.channelId !== process.env.CHANNEL_ID) return

  // The message starts with the correct prefix
  if (!message.content.startsWith(prefix)) return
  // The message ends with the correct suffix
  if (!message.content.endsWith(suffix)) return
  // The message is not just the prefix and suffix, it has at least one character
  if (!message.content.length >= 3) return

  const conversation = [
    {
      role: 'system',
      content: 'Eres una herramienta muy útil.'
    }
  ]

  await message.channel.sendTyping()

  const prevMsg = await message.channel.messages.fetch({ limit: 15 })
  prevMsg.reverse()

  prevMsg.forEach((msg) => {
    if (!message.content.length >= 3) return
    if (msg.author.id !== message.author.id) return
    if (!message.content.endsWith(suffix)) return
    if (!message.content.startsWith(prefix)) return
    if (msg.author.id !== client.user.id && message.author.bot) return

    conversation.push({
      role: 'user',
      content: msg.content
    })
  })

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: conversation
  })

  const content = response.data.choices[0].message
  return message.reply(content)
  // try {
  // } catch (error) {
  //   return message.reply('Solo soy una IA intentando ayudar :v')
  // }
})

client.login(process.env.BOT_TOKEN)
