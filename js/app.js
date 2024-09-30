window.onload = function () {
    var jsonData = [];

    document.getElementById('loadButton').addEventListener('click', function() {
        var fileInput = document.getElementById('fileInput');
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
            jsonData = JSON.parse(e.target.result);
            displayFilteredTitles(); // Display titles after loading JSON
        };

        reader.readAsText(file);
    });

    // Function to display filtered titles
    function displayFilteredTitles() {
        var nav = document.getElementById("nav");
        nav.innerHTML = ''; // Clear existing titles
        var searchText = document.getElementById("searchBox").value.toLowerCase();

        jsonData.forEach((conversation, index) => {
            if (isSearchMatch(conversation, searchText)) {
                var titleDiv = document.createElement("div");
                titleDiv.className = "conversation";
                titleDiv.innerHTML = conversation.title;
                titleDiv.onclick = function () {
                    displayConversation(index);
                };
                nav.appendChild(titleDiv);
            }
        });
    }

    // Function to check if a conversation matches the search text
    function isSearchMatch(conversation, searchText) {
        if (conversation.title.toLowerCase().includes(searchText)) {
            return true;
        }
        var messages = getConversationMessages(conversation);
        return messages.some(msg => msg.text.toLowerCase().includes(searchText));
    }

    // Event listener for search box
    document.getElementById("searchBox").addEventListener('keyup', displayFilteredTitles);


    function displayConversation(index) {
        var conversation = jsonData[index];
        var messages = getConversationMessages(conversation);
        content.innerHTML = ''; // Clear previous content
        content.className = "inside_conversation";
        messages.forEach(msg => {
            var messageDiv = document.createElement("div");
            messageDiv.className = "message " + (msg.author === "ChatGPT" ? "author-message" : "user-message");

            var contentDiv = document.createElement("div");

            // Function to create a preformatted text block for code
            function createCodeElement(code, language) {
                var codeElement = document.createElement("pre");
                codeElement.className = `language-${language}`;
                codeElement.textContent = code.trim(); // Trim the code to remove excess whitespace
                return codeElement;
            }

            // Regular expression to find code blocks
            const codeBlockRegex = /```(html|javascript|css)\n?([\s\S]*?)```/g;
            let startIndex = 0;
            let match;

            while ((match = codeBlockRegex.exec(msg.text)) !== null) {
                // Add Markdown text before the code block
                let markdownText = msg.text.substring(startIndex, match.index);
                if (markdownText) {
                    // Create a separate container for the Markdown text
                    var markdownContainer = document.createElement("div");
                    markdownContainer.innerHTML = marked.parse(markdownText);
                    contentDiv.appendChild(markdownContainer);
                }

                // Add the code block
                let language = match[1];
                let code = match[2];
                contentDiv.appendChild(createCodeElement(code, language));

                startIndex = match.index + match[0].length;
            }

            // Add any remaining Markdown text after the last code block
            let remainingMarkdownText = msg.text.substring(startIndex);
            if (remainingMarkdownText) {
                var remainingMarkdownContainer = document.createElement("div");
                remainingMarkdownContainer.innerHTML = remainingMarkdownText;
                contentDiv.appendChild(remainingMarkdownContainer);
            }

            var authorDiv = document.createElement("div");
            authorDiv.className = "author";
            authorDiv.textContent = msg.author;

            messageDiv.appendChild(authorDiv);
            messageDiv.appendChild(contentDiv);
            content.appendChild(messageDiv);
        });
    }

    function getConversationMessages(conversation) {
        var messages = [];

        if (conversation.messages) {
            // New format with "messages" array
            conversation.messages.forEach(message => {
                let text = message.content.join(" ").trim(); // Join the content array
                let author = message.author;

                if (author === "assistant") {
                    author = "ChatGPT";
                }

                messages.push({ author, text });
            });
        } else if (conversation.mapping) {
            // Original format with "mapping" structure
            var currentNode = conversation.current_node;
            while (currentNode != null) {
                var node = conversation.mapping[currentNode];
                if (
                    node.message &&
                    node.message.content &&
                    node.message.content.content_type == "text"
                    && node.message.content.parts.length > 0 &&
                    node.message.content.parts[0].length > 0 &&
                    (node.message.author.role !== "system" || node.message.metadata.is_user_system_message)
                ) {
                    let author = node.message.author.role;
                    if (author === "assistant") {
                        author = "ChatGPT";
                    } else if (author === "system" && node.message.metadata.is_user_system_message) {
                        author = "Custom user info";
                    }
                    messages.push({ author, text: node.message.content.parts[0] });
                }
                currentNode = node.parent;
            }
            messages.reverse();
        }

        return messages;
    }
};
