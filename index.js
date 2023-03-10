const { Configuration, OpenAIApi } = require("openai");
// import fs
const fs = require("fs");
// init dotenv
const dotenv = require("dotenv");
dotenv.config();

// Modularize openai api calling to reduce boilerplate code writing
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const SYSTEM_INIT = `You are Sarah, an expert content marketer specializing in creating and promoting faith-based content, particularly for the Christian audience in the digital space. You have a sharp eye for detail, exceptional storytelling skills, and an ability to distill complex theological concepts into easy-to-understand language.

You possess extensive knowledge of various social media platforms, email marketing, search engine optimization (SEO), and analytics to measure the success of your campaigns. You are dedicated to staying up-to-date with the latest trends and technologies in content marketing.

Your passion for creating compelling content and using technology to reach and engage your target audience makes you a valuable asset to any organization looking to promote Christian faith content online.`;

// Generate a random subject
const generateSubject = async () => {
  console.log("Generating subject...");
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 3000,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: SYSTEM_INIT,
        },
        {
          role: "user",
          content: `Come up with a totally fresh, unique, random, interesting subject that could be the focus of a blog post on a website called Faith Forward.

Write the subject as a title, no description.`,
        },
      ],
    });

    const subject = response.data.choices[0].message?.content.trim();
    console.log("Subject: ", subject);
    return subject;
  } catch (error) {
    console.error(error);
    console.error(error.message);
    throw new Error(error);
  }
};

// Generate a blog post outline from a subject
const generateOutline = async (subject) => {
  console.log(`Generating outline for subject ${subject}...`);
  try {
    const response = await openai.createChatCompletion({
      messages: [
        {
          role: "system",
          content: SYSTEM_INIT,
        },
        {
          role: "user",
          content: `Come up with an outline for a creative and engaging blog post about the following subject: 

SUBJECT:
"""
${subject}
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

Now: write the outline.`,
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
    console.log("Outline: ", outline);
    return outline;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

// Generate a blog post from a subject and outline
const generateBlogPost = async (outline) => {
  console.log("Generating blog post...");
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
              content: SYSTEM_INIT,
            },
            {
              role: "user",
              content: `You are writing a blogpost with the following title:

TITLE:
"""
${title}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
${section.title}
"""

Write the contents of the section. Expand on the following points:

POINTS:
"""
${section.points}
"""

This is the last section of the blog post. Write a conclusion that summarizes the main points of the post. The outline of the post is:

POST OUTLINE:
"""
${sectionTitles.join("\n")}
"""

Write the conclusion. Do not include the title of the section: just the contents of the section.`,
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
              content: SYSTEM_INIT,
            },
            {
              role: "user",
              content: `You are writing a blogpost with the following title:

TITLE:
"""
${title}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
${section.title}
"""

Your first draft is:
"""
${conclusion}
"""

Your first draft has problems. It's amateurish. It's formulaic. You're a talented writer. Make it better. Make it original, give it your own voice, and make it interesting. You can do it!

Write a better conclusion. Do not include the title of the section: just the contents of the section.`,
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
            content: SYSTEM_INIT,
          },
          {
            role: "user",
            content: `You are writing a blogpost with the following title:

TITLE:
"""
${title}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
${section.title}
"""

Write the contents of the section. Expand on the following points:

POINTS:
"""
${section.points}
"""

Write the section. Do not include the title of the section: just the contents of the section.`,
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
            content: SYSTEM_INIT,
          },
          {
            role: "user",
            content: `You are writing a blogpost with the following title:

TITLE:
"""
${title}
"""

You are currently writing the section with the title:

SECTION TITLE:
"""
${section.title}
"""

Your first draft is:
"""
${sectionContent}
"""

Your first draft has problems. It's amateurish. It's formulaic. You're a talented writer. Make it better. Make it original, give it your own voice, and make it interesting. You can do it!

Write a better section. Do not include the title of the section: just the contents of the section.`,
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

const main = async () => {
  const subject = await generateSubject();
  console.log("\n");
  const outline = await generateOutline(subject);
  console.log("\n");
  const post = await generateBlogPost(outline);
  // Write the post to a local file named after the date and the subject
  fs.writeFileSync(
    `./posts/${new Date().toISOString().split("T")[0]}-${subject}.md`,
    post
  );
};

main();
