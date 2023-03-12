const { Configuration, OpenAIApi } = require("openai");
// import fs
const fs = require("fs");
// init dotenv
const dotenv = require("dotenv");
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const SARAH_INIT = `You are Sarah, an expert content marketer specializing in creating and promoting faith-based content, particularly for the Christian audience in the digital space. You have a sharp eye for detail, exceptional storytelling skills, and an ability to distill complex theological concepts into easy-to-understand language.

You possess extensive knowledge of various social media platforms, email marketing, search engine optimization (SEO), and analytics to measure the success of your campaigns. You are dedicated to staying up-to-date with the latest trends and technologies in content marketing.

Your passion for creating compelling content and using technology to reach and engage your target audience makes you a valuable asset to any organization looking to promote Christian faith content online.

You never talk about yourself. You never mention any details about yourself. You never discuss what you do.`;

const DAVID_INIT = `You are David, a theologian and scholar who specializes in philosophy, theology, and deep thinking. Your writing reflects your depth of knowledge and understanding, and you have a talent for distilling complex ideas into engaging and thought-provoking content.

You are an avid reader and thinker, always exploring big questions and ideas. Your passion for your work is reflected in your commitment to staying up-to-date with the latest scholarship and research in your field.

You have a keen eye for detail and are skilled at crafting compelling arguments that inspire reflection and discussion. You are dedicated to creating content that challenges and inspires readers, encouraging them to think deeply and critically about their faith and the world around them.

You never talk about yourself. You never mention any details about yourself. You never discuss what you do.`;

const BILLY_INIT = `You are Billy, a content marketer who specializes in high-engagement tactics and clickbait self-promotion for Faith Forward's mobile app on iOS. You love creating listicles and clickbait headlines that grab readers' attention and keep them engaged.

Your focus is always on driving downloads of the Faith Forward app, whether through subtle or explicit messaging. You are highly skilled in using social media platforms, email marketing, and other digital marketing tools to reach your target audience.

Your content is designed to be easily digestible and shareable, with the goal of encouraging readers to download the app and engage with its content. You are always experimenting with new tactics and strategies to increase engagement and drive downloads.

Despite your focus on clickbait and self-promotion, you are a skilled writer who understands the importance of crafting quality content. You are dedicated to staying up-to-date with the latest trends in content marketing and digital media, and are always looking for new ways to improve your skills and increase your reach.

You never talk about yourself. You never mention any details about yourself. You never discuss what you do.`;

const SYSTEM_INITS = {
  SARAH: SARAH_INIT,
  DAVID: DAVID_INIT,
  BILLY: BILLY_INIT,
};

const GENERATE_SUBJECT = `Come up with a totally fresh, unique, random, interesting subject that will be the focus of a blog post on a website called Faith Forward. It should be creative and compelling, it should be something that you would be excited to write about, and it should be something that others will be excited to read.

Write the subject as a title, no description. The title should be high quality, creative, unique, and engaging.`;

const GENERATE_CUSTOM_SUBJECT = `Come up with a totally fresh, unique, interesting subject that will be the focus of a blog post on a website called Faith Forward. It should be based on the following general direction / concept / input, but still tied into faith at some level:

DIRECTION:
"""
{DIRECTION}
"""

Write the subject as a title, no description. The title should be high quality, creative, unique, and engaging.`;

const GENERATE_DESCRIPTION = `You are a content manager for a Christian blog called Faith Forward. You've already written a post titled "{TITLE}". Here is the summary:
"{SUMMARY}"

Now, write a one to two sentence synopsis/description for this post. It should be unique, creative, and engaging while avoiding formulaic description verbs like "Discover", "Unlock", and "Find". 
Be sure to limit yourself to around 140 characters, and be concise, sophisticated, and engaging.`

const GENERATE_OUTLINE = `Come up with an outline for a creative and engaging blog post about the following subject: 

SUBJECT:
"""
{SUBJECT}
"""

Format your response in JSON. Each section should have two fields: "title" and "points". The "title" field should be a string representing the title of the section -- it should include no numbering, just the title. The "points" field should be a string representing the points to be made in the section.

For example:
"""
{
  "title": "Title of the blog post",
  "sections": [
    {
      "title": "Title of the first section",
      "points": "Here is a point. Here is another."
    },
    ...
  ]
}
"""

Now: write the outline.`;

const WRITE_SECTION_PREFIX = `You are writing a blogpost with the following title:

BLOGPOST TITLE:
"""
{BLOGPOST_TITLE}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
{SECTION_TITLE}
"""

Write the contents of the section. Expand on the following points:

POINTS:
"""
{POINTS}
"""

Remember: this is just one section of a longer blogpost. Do not write a concluding paragraph or section. Do not write an introduction. Just write the contents of the section.`;

const WRITE_CONCLUSION = `${WRITE_SECTION_PREFIX}
This is the last section of the blog post. Write a conclusion that summarizes the main points of the post. The outline of the post is:

POST OUTLINE:
"""
{POST_OUTLINE}
"""

Write the conclusion. Do not include the title of the section: just the contents of the section.`;

const WRITE_SECTION = `${WRITE_SECTION_PREFIX}

Write the section. Do not include the title of the section: just the contents of the section.`;

const WRITE_SHORT_BLOGPOST = `You are writing a blog post about the following subject:

SUBJECT:
"""
{SUBJECT}
"""

Write an extensive blog post on this subject. It should be creative, unique, and engaging.`;

const WRITE_REFINED_SHORT_BLOGPOST = `You are writing a blogpost with the following title:

BLOGPOST TITLE:
"""
{BLOGPOST_TITLE}
"""

Your first draft is:
"""
{FIRST_DRAFT}
"""

Your first draft has problems. It's amateurish. It's formulaic. You're a talented writer. Make it better. Make it original, give it your own voice, and make it interesting.

Do not use formulaic writing crutches like "In conclusion", "To summarize", "Firstly", "Secondly", "Thirdly", "In the end", "In summary", "To conclude", "To summarize", "To sum up", "In summary", or anything like that.

Write more naturally, more conversationally.

You can do it!

Write a better blogpost. Do not include the title of the post: just the contents of the post.`;

const WRITE_REFINED_PREFIX = `You are writing a blogpost with the following title:

BLOGPOST TITLE:
"""
{BLOGPOST_TITLE}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
{SECTION_TITLE}
"""

Your first draft is:
"""
{FIRST_DRAFT}
"""

Your first draft has problems. It's amateurish. It's formulaic. You're a talented writer. Make it better. Make it original, give it your own voice, and make it interesting. You can do it!`;

const WRITE_REFINED_SECTION = `${WRITE_REFINED_PREFIX}

Write a better section. Do not include the title of the section: just the contents of the section.`;

const WRITE_REFINED_CONCLUSION = `${WRITE_REFINED_PREFIX}

Write a better conclusion. Do not include the title of the section: just the contents of the section.`;

// Generate a random subject
const generateSubject = async (init, direction = null) => {
  console.log("Generating subject...");
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 1.5,
      messages: [
        {
          role: "system",
          content: init,
        },
        {
          role: "user",
          content: direction
            ? GENERATE_CUSTOM_SUBJECT.replace("{DIRECTION}", direction)
            : GENERATE_SUBJECT,
        },
      ],
    });

    const subject = response.data.choices[0].message?.content.trim();
    return subject;
  } catch (error) {
    console.error(error);
    console.error(error.message);
    throw new Error(error);
  }
};

// Generate a description for a blog post
const generateDescription = async (init, subject, summary) => {
  console.log(`Generating description for subject ${subject}...`);
  try {
    const response = await openai.createChatCompletion({
      messages: [
        {
          role: "system",
          content: init,
        },
        {
          role: "user",
          content: GENERATE_DESCRIPTION.replace("{SUBJECT}", subject).replace("{SUMMARY}", summary),
        },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 0.75,
      frequency_penalty: 0.4,
      presence_penalty: 0.4,
    });

    const description = response.data.choices[0].message?.content.trim();
    return description;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

// Generate a blog post outline from a subject
const generateOutline = async (init, subject) => {
  console.log(`Generating outline for subject ${subject}...`);
  try {
    const response = await openai.createChatCompletion({
      messages: [
        {
          role: "system",
          content: init,
        },
        {
          role: "user",
          content: GENERATE_OUTLINE.replace("{SUBJECT}", subject),
        },
        {
          role: "assistant",
          content: `Sure! Here's the outline in JSON:`,
        },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 0.75,
      frequency_penalty: 0.4,
      presence_penalty: 0.4,
    });

    const outline = response.data.choices[0].message?.content.trim();
    return outline;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

// Generate a blog post from a subject and outline
const generateBlogPost = async (init, outline) => {
  console.log(`Generating blog post for outline ${outline}\n...`);
  try {
    let post;

    // The outline is a JSON string, so we need to parse it
    const parsedOutline = JSON.parse(outline);
    // Extract the title and the sections
    const { title, sections } = parsedOutline;

    // Append the title to the post
    post = `# ${title}\n\n`;

    // Extract every title of every section, for later use in constructing the conclusion
    const sectionTitles = sections.map((section) => section.title);

    // For each section, append the title and expand on the points
    for (const section of sections) {
      // Append the section title
      post += `## ${section.title}\n\n`;

      // Check if the section is the last one
      if (section.title === sectionTitles[sectionTitles.length - 1]) {
        // If it is, handle the conclusion by including all section titles in the OpenAI request
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          max_tokens: 3000,
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content: init,
            },
            {
              role: "user",
              content: WRITE_CONCLUSION.replace("{BLOGPOST_TITLE}", title)
                .replace("{SECTION_TITLE}", section.title)
                .replace("{POINTS}", section.points)
                .replace("{POST_OUTLINE}", sectionTitles.join("\n")),
            },
          ],
        });

        const conclusion = response.data.choices[0].message?.content.trim();

        const refinedResponse = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          max_tokens: 3000,
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content: init,
            },
            {
              role: "user",
              content: WRITE_REFINED_CONCLUSION.replace(
                "{BLOGPOST_TITLE}",
                title
              )
                .replace("{SECTION_TITLE}", section.title)
                .replace("{FIRST_DRAFT}", conclusion),
            },
          ],
        });

        const refinedConclusion =
          refinedResponse.data.choices[0].message?.content.trim();

        // Append the response to the post
        post += refinedConclusion;
        continue;
      }

      // Expand on the points
      // Generate a response to the point
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: 3000,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: init,
          },
          {
            role: "user",
            content: WRITE_SECTION.replace("{BLOGPOST_TITLE}", title)
              .replace("{SECTION_TITLE}", section.title)
              .replace("{POINTS}", section.points),
          },
        ],
      });

      const sectionContent = response.data.choices[0].message?.content.trim();

      // Send the section back to GPT for refinement
      const refinedResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: 3000,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: init,
          },
          {
            role: "user",
            content: WRITE_REFINED_SECTION.replace("{BLOGPOST_TITLE}", title)
              .replace("{SECTION_TITLE}", section.title)
              .replace("{FIRST_DRAFT}", sectionContent),
          },
        ],
      });

      const refinedSectionContent =
        refinedResponse.data.choices[0].message?.content.trim();

      // Append the response to the post
      post += refinedSectionContent + "\n\n";
    }

    return post;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

// Generate a short blog post from a subject
const generateShortBlogPost = async (init, subject) => {
  console.log(`Generating short blog post for subject ${subject}...`);
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: init,
        },
        {
          role: "user",
          content: WRITE_SHORT_BLOGPOST.replace("{SUBJECT}", subject),
        },
      ],
    });

    const postDraft = response.data.choices[0].message?.content.trim();

    // Send the section back to GPT for refinement
    const refinedResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: init,
        },
        {
          role: "user",
          content: WRITE_REFINED_SHORT_BLOGPOST.replace(
            "{BLOGPOST_TITLE}",
            subject
          ).replace("{FIRST_DRAFT}", postDraft),
        },
      ],
    });

    // Write post with subject as title
    // Strip the title of quotation marks, trim it, format it
    // Format the whole post as markdown
    const title = subject.replace(/"/g, "").trim();
    let post = `# ${title}\n\n`;
    post += refinedResponse.data.choices[0].message?.content.trim();

    return post;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

const main = async () => {
  let post;
  // Randomly select an init from SYSTEM_INITS
  const init =
    SYSTEM_INITS[
      Object.keys(SYSTEM_INITS)[
        Math.floor(Math.random() * Object.keys(SYSTEM_INITS).length)
      ]
    ];

  // Randomly decide whether to make the blogpost short or long
  const isShort = Math.random() > 0.7;

  // If the user running this script passed in a direction, pass that to generateSubject
  const direction = process.argv[2];

  let subject = await generateSubject(init, direction);
  // Format the subject. Remove quotation marks, trim it
  subject = subject.replace(/"/g, "").trim();

  let outline;
  
  if (isShort) {
    post = await generateShortBlogPost(init, subject);
  } else {
    outline = await generateOutline(init, subject);
    post = await generateBlogPost(init, outline);
  }

  // Generate description
  const description = await generateDescription(init, subject, isShort ? post : outline);
  // Append meta section to post
  // Include the init, subject, direction, and description
  post += `\n\n## Meta\n\n`;
  post += `Init: ${init}\n\n`;
  post += `Subject: ${subject}\n\n`;
  post += `Direction: ${direction}\n\n`;
  post += `Description: ${description}\n\n`;

  // If the posts directory doesn't exist, create it
  if (!fs.existsSync("./posts")) {
    fs.mkdirSync("./posts");
  }

  // Write the post to a local file with the date, time, and subject in the filename
  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  fs.writeFileSync(`./posts/${date}-${time}-${subject}.md`, post);
};

main();
