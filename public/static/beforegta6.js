
        const DEFAULT_POSTS = [
            {
                title: 'We got flying taxis before GTA 6',
                description: 'Prototype eVTOL fleets now operate in three test cities with paid commuter routes.',
                image: '/static/images/beforegta6.jpg',
                author: '@Gamer_Life',
                daysAgo: 0,
                upvotes: 12000,
                downvotes: 420,
                comments: 1500,
                badge: 'News',
                tags: ['Science', 'News']
            },
            {
                title: 'We got AI-powered toasters before GTA 6',
                description: 'They can read nutrition labels, detect bread type, and roast with computer vision now.',
                image: '/static/images/beforegta6.jpg',
                author: '@Tech_Junkie',
                daysAgo: 1,
                upvotes: 8000,
                downvotes: 330,
                comments: 900,
                badge: 'Gadgets',
                tags: ['Entertainment']
            },
            {
                title: 'We got fully immersive VR before GTA 6',
                description: 'Consumer setups now do eye tracking, haptics, and full body movement in one kit.',
                image: '/static/images/beforegta6.jpg',
                author: '@Future_Now',
                daysAgo: 2,
                upvotes: 20000,
                downvotes: 790,
                comments: 3200,
                badge: 'Tech',
                tags: ['Gaming']
            },
            {
                title: 'We got neural city planners before GTA 6',
                description: 'Simulation models now optimize traffic and zoning plans across entire metro regions.',
                image: '/static/images/beforegta6.jpg',
                author: '@CyberSec',
                daysAgo: 3,
                upvotes: 15000,
                downvotes: 550,
                comments: 2100,
                badge: 'Future',
                tags: ['Politics', 'Science']
            }
        ];

        let posts = [];

        const postGrid = document.getElementById('postGrid');
        const toast = document.getElementById('toast');
        const navButtons = document.querySelectorAll('.nav-links button');
        const sidebarButtons = document.querySelectorAll('.sidebar button[data-tab]');
        const pollResults = document.getElementById('pollResults');
        const pollChoices = document.getElementById('pollChoices');

        const createBtn = document.getElementById('createBtn');
        const createModal = document.getElementById('createModal');
        const postTitleInput = document.getElementById('postTitle');
        const postDescInput = document.getElementById('postDescription');
        const tagList = document.getElementById('tagList');
        const titleCount = document.getElementById('titleCount');
        const descCount = document.getElementById('descCount');
        const cancelCreateBtn = document.getElementById('cancelCreate');
        const submitCreateBtn = document.getElementById('submitCreate');
        const modalCloseBtn = document.querySelector('.modal-close');
        const formError = document.getElementById('formError');

        const uploadDropzone = document.getElementById('uploadDropzone');
        const postImageInput = document.getElementById('postImageInput');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');

        const loginBtn = document.getElementById('loginBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        const authSheet = document.getElementById('authSheet');
        const closeAuthSheet = document.getElementById('closeAuthSheet');
        const authOptions = document.querySelectorAll('.auth-option');

        const usernameModal = document.getElementById('usernameModal');
        const usernameInput = document.getElementById('usernameInput');
        const usernameError = document.getElementById('usernameError');
        const saveUsernameBtn = document.getElementById('saveUsernameBtn');
        const closeUsernameModalBtn = document.getElementById('closeUsernameModal');

        const modeToggle = document.getElementById('modeToggle');

        const categories = ['Science', 'Movie & TV', 'Entertainment', 'NEWS', 'Youtube', 'Gaming', 'Medicine', 'Politics'];
        const STORAGE_KEYS = {
            username: 'beforegta6_username',
            theme: 'beforegta6_theme',
            profile: 'beforegta6_profile'
        };

        let uploadedImageDataUrl = '';
        let currentUsername = localStorage.getItem(STORAGE_KEYS.username) || '';
        let pendingCreateDraft = null;

        function formatCompactNumber(value) {
            const num = Number(value) || 0;
            if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
            if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
            return String(num);
        }

        function formatDaysAgo(daysAgo) {
            if (daysAgo <= 0) return 'Today';
            if (daysAgo === 1) return '1 day ago';
            return `${daysAgo} days ago`;
        }

        function normalizeIncomingPost(post) {
            return {
                post_key: post.post_key || `local-${Math.random().toString(36).slice(2, 10)}`,
                title: post.title || 'Untitled post',
                description: post.description || '',
                image: post.image || '/static/images/beforegta6.jpg',
                author: post.author || '@Unknown',
                daysAgo: Number(post.daysAgo ?? post.days_ago ?? 0) || 0,
                upvotes: Number(post.upvotes || 0),
                downvotes: Number(post.downvotes || 0),
                comments: Number(post.comments || 0),
                badge: post.badge || 'General',
                tags: Array.isArray(post.tags) ? post.tags : []
            };
        }

        function escapeHtml(text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function readFileAsDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        function setUploadPreview(src) {
            uploadedImageDataUrl = src || '';
            if (uploadedImageDataUrl) {
                uploadPreview.src = uploadedImageDataUrl;
                uploadPreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
            } else {
                uploadPreview.removeAttribute('src');
                uploadPreview.style.display = 'none';
                uploadPlaceholder.style.display = 'flex';
            }
        }

        function buildGradientFromSeed(seed) {
            let hash = 0;
            for (let i = 0; i < seed.length; i += 1) {
                hash = (hash << 5) - hash + seed.charCodeAt(i);
                hash |= 0;
            }

            const hueA = Math.abs(hash % 360);
            const hueB = (hueA + 70) % 360;
            const hueC = (hueA + 140) % 360;
            return [`hsl(${hueA} 95% 58%)`, `hsl(${hueB} 92% 55%)`, `hsl(${hueC} 95% 62%)`];
        }

        function generateImageFromContext(title, description) {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d');
            const seed = `${title} ${description}`.trim() || 'vice city';
            const [colorA, colorB, colorC] = buildGradientFromSeed(seed);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, colorA);
            gradient.addColorStop(0.5, colorB);
            gradient.addColorStop(1, colorC);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(990, 120, 180, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(12, 8, 29, 0.44)';
            ctx.fillRect(70, 70, canvas.width - 140, canvas.height - 140);

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 64px Teko, sans-serif';
            ctx.fillText('WE GOT', 110, 178);

            ctx.font = '700 58px Teko, sans-serif';
            const titleLine = title.toUpperCase().slice(0, 56);
            ctx.fillText(titleLine, 110, 262);

            ctx.font = '700 54px Teko, sans-serif';
            ctx.fillText('BEFORE GTA 6', 110, 340);

            ctx.font = '500 30px Outfit, sans-serif';
            const safeDesc = description.slice(0, 110) || 'A new post from Before GTA 6';
            ctx.fillText(safeDesc, 110, 412);

            return canvas.toDataURL('image/png');
        }

        function renderTagOptions() {
            tagList.innerHTML = '';
            categories.forEach((cat) => {
                const id = `tag-${cat.replace(/\s+/g, '-').toLowerCase()}`;
                const label = document.createElement('label');
                label.className = 'tag-item';
                label.innerHTML = `
                    <input type="checkbox" value="${cat}" id="${id}" />
                    <span>${cat}</span>
                `;
                tagList.appendChild(label);
            });

            tagList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
                checkbox.addEventListener('change', () => {
                    const checked = tagList.querySelectorAll('input[type="checkbox"]:checked');
                    if (checked.length > 3) {
                        checkbox.checked = false;
                        showToast('You can select up to 3 tags.');
                    }
                });
            });
        }

        async function loadPostsFromServer() {
            try {
                const response = await fetch('/api/beforegta6/posts');
                const data = await response.json();
                if (data.success && Array.isArray(data.posts) && data.posts.length) {
                    posts = data.posts.map(normalizeIncomingPost);
                    return;
                }
            } catch (error) {
                // Fall back to local defaults if API is unavailable.
            }
            posts = DEFAULT_POSTS.map(normalizeIncomingPost);
        }

        async function submitVote(postKey, voteType, button) {
            if (!postKey) {
                showToast('Unable to vote on this post.');
                return;
            }

            if (button) button.disabled = true;
            try {
                const response = await fetch('/api/beforegta6/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_key: postKey, vote_type: voteType })
                });
                const data = await response.json();
                if (!data.success) {
                    showToast(data.message || 'Unable to register vote.');
                    return;
                }

                const target = posts.find((post) => post.post_key === data.post_key);
                if (target) {
                    target.upvotes = Number(data.upvotes || 0);
                    target.downvotes = Number(data.downvotes || 0);
                }
                renderPosts();
            } catch (error) {
                showToast('Vote failed. Please try again.');
            } finally {
                if (button) button.disabled = false;
            }
        }

        function getSelectedTags() {
            return Array.from(tagList.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
        }

        function openCreateModal() {
            renderTagOptions();
            postTitleInput.value = '';
            postDescInput.value = '';
            formError.textContent = '';
            titleCount.textContent = '0';
            descCount.textContent = '0';
            postImageInput.value = '';
            setUploadPreview('');
            createModal.classList.add('open');
            createModal.setAttribute('aria-hidden', 'false');
            postTitleInput.focus();
        }

        function closeCreateModal() {
            createModal.classList.remove('open');
            createModal.setAttribute('aria-hidden', 'true');
        }

        function showToast(message) {
            toast.textContent = message;
            toast.classList.add('show');
            clearTimeout(toast._timeout);
            toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
        }

        function openAuthSheet() {
            authSheet.classList.add('open');
            authSheet.setAttribute('aria-hidden', 'false');
        }

        function closeAuth() {
            authSheet.classList.remove('open');
            authSheet.setAttribute('aria-hidden', 'true');
        }

        async function completeSocialLogin(provider) {
            const handle = window.prompt(`Enter your ${provider} handle:`);
            if (!handle || !handle.trim()) {
                showToast('Login cancelled.');
                return;
            }

            try {
                const response = await fetch('/api/social-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider, handle: handle.trim() })
                });
                const data = await response.json();
                if (!data.success) {
                    showToast(data.message || 'Unable to complete login.');
                    return;
                }

                currentUsername = data.username;
                localStorage.setItem(STORAGE_KEYS.username, currentUsername);
                localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(data.profile));
                usernameModal.classList.remove('open');
                usernameModal.setAttribute('aria-hidden', 'true');
                showToast(`Signed in with ${provider}.`);
            } catch (error) {
                showToast('Could not connect. Please try again.');
            }
        }

        function requireUsernameOnFirstVisit() {
            if (currentUsername) return;
            usernameModal.classList.add('open');
            usernameModal.setAttribute('aria-hidden', 'false');
            usernameInput.focus();
        }

        function closeUsernameModal() {
            usernameModal.classList.remove('open');
            usernameModal.setAttribute('aria-hidden', 'true');
            usernameError.textContent = '';
        }

        async function createPostWithDraft(draft) {
            const { title, description, image, tags, badge, author } = draft;

            try {
                const createResponse = await fetch('/api/beforegta6/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        image,
                        author,
                        badge,
                        tags
                    })
                });
                const createData = await createResponse.json();
                if (!createData.success) {
                    showToast(createData.message || 'Unable to create post.');
                    return false;
                }

                posts.unshift(normalizeIncomingPost(createData.post));
                renderPosts();
                closeCreateModal();
                showToast('Created new post.');

                await fetch('/api/post-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, author, tags })
                });
                return true;
            } catch (error) {
                showToast('Could not save post right now.');
                return false;
            }
        }

        function handleSaveUsername() {
            const value = usernameInput.value.trim();
            if (!value) {
                usernameError.textContent = 'Please enter a username.';
                return;
            }
            if (value.length < 3) {
                usernameError.textContent = 'Username must be at least 3 characters.';
                return;
            }

            currentUsername = value;
            localStorage.setItem(STORAGE_KEYS.username, currentUsername);
            closeUsernameModal();
            usernameError.textContent = '';
            showToast('Username saved.');

            if (pendingCreateDraft) {
                const draft = {
                    ...pendingCreateDraft,
                    author: `@${currentUsername}`
                };
                pendingCreateDraft = null;
                createPostWithDraft(draft);
            }
        }

        function buildPostCard(post, index) {
            const card = document.createElement('article');
            card.className = 'card';

            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `
                <h3>${escapeHtml(post.title)}</h3>
                <span class="badge">${escapeHtml(post.badge)}</span>
            `;

            const image = document.createElement('div');
            image.className = 'card-image';
            image.style.backgroundImage = `url('${post.image}')`;

            const meta = document.createElement('div');
            meta.className = 'card-meta';
            meta.innerHTML = `
                <div class="avatar">${escapeHtml(post.author.replace('@', '').slice(0, 2).toUpperCase() || 'BG')}</div>
                <div class="meta-text">
                    <span class="posted-by">Posted by ${escapeHtml(post.author)}</span>
                    <div class="metrics">
                        <button class="vote-btn upvote-btn" type="button" aria-label="Upvote">
                            <span>⬆</span><span>${formatCompactNumber(post.upvotes)}</span>
                        </button>
                        <button class="vote-btn downvote-btn" type="button" aria-label="Downvote">
                            <span>⬇</span><span>${formatCompactNumber(post.downvotes)}</span>
                        </button>
                        <span class="metric-pill">🕒 ${formatDaysAgo(post.daysAgo)}</span>
                        <span class="metric-pill">💬 ${formatCompactNumber(post.comments)} Comments</span>
                    </div>
                </div>
            `;

            const upvoteBtn = meta.querySelector('.upvote-btn');
            const downvoteBtn = meta.querySelector('.downvote-btn');
            upvoteBtn.addEventListener('click', () => submitVote(post.post_key, 'up', upvoteBtn));
            downvoteBtn.addEventListener('click', () => submitVote(post.post_key, 'down', downvoteBtn));

            const actions = document.createElement('div');
            actions.className = 'card-actions';
            actions.innerHTML = `
                <button class="share-btn" title="Share post" aria-label="Share post">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 5L21 10L16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <input class="comment-input" type="text" placeholder="Add a comment..." aria-label="Comment input" />
            `;

            const shareBtn = actions.querySelector('.share-btn');
            shareBtn.addEventListener('click', () => sharePost(post));

            const commentInput = actions.querySelector('.comment-input');
            commentInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && commentInput.value.trim()) {
                    post.comments += 1;
                    commentInput.value = '';
                    renderPosts();
                    showToast('Comment posted.');
                }
            });

            card.append(header);

            if (post.description) {
                const desc = document.createElement('p');
                desc.className = 'card-desc';
                desc.textContent = post.description;
                card.append(desc);
            }

            card.append(image, meta);

            if (post.tags && post.tags.length) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'card-tags';
                tagsEl.innerHTML = post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
                card.append(tagsEl);
            }

            card.dataset.index = String(index);
            card.append(actions);
            return card;
        }

        function sharePost(post) {
            const shareTitle = post.title;
            const shareText = `${post.title} - ${post.description || ''}`.trim();
            const shareUrl = window.location.href;

            if (navigator.share) {
                navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
                return;
            }

            const encodedText = encodeURIComponent(shareText);
            const encodedUrl = encodeURIComponent(shareUrl);
            const options = {
                x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(shareTitle)}`,
                whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
            };

            const choice = window.prompt('Share on: x, facebook, reddit, whatsapp, copy');
            if (!choice) return;
            const selected = choice.trim().toLowerCase();

            if (selected === 'copy') {
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
                    .then(() => showToast('Link copied.'))
                    .catch(() => showToast('Unable to copy right now.'));
                return;
            }

            if (options[selected]) {
                window.open(options[selected], '_blank', 'noopener,noreferrer');
            } else {
                showToast('Unsupported platform. Try x, facebook, reddit, whatsapp, or copy.');
            }
        }

        function renderPosts() {
            postGrid.innerHTML = '';
            posts.forEach((post, index) => postGrid.appendChild(buildPostCard(post, index)));
        }

        function parseMetric(value) {
            const match = String(value).trim().match(/^([\d.]+)\s*([kKmM])?$/);
            if (!match) return Number(value) || 0;
            const num = parseFloat(match[1]);
            const unit = match[2] ? match[2].toLowerCase() : '';
            if (unit === 'k') return num * 1000;
            if (unit === 'm') return num * 1000000;
            return num;
        }

        function activateTab(name) {
            const titleMap = {
                latest: 'Latest Posts',
                popular: 'Popular',
                trending: 'Trending'
            };

            const dropdownToggle = document.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.dataset.tab = name;
                dropdownToggle.textContent = `${(titleMap[name] || 'Popular').toUpperCase()} ▾`;
            }

            navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
            sidebarButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));

            if (name === 'popular') {
                posts.sort((a, b) => parseMetric(b.upvotes) - parseMetric(a.upvotes));
            } else if (name === 'latest') {
                posts.sort((a, b) => a.daysAgo - b.daysAgo);
            } else if (name === 'trending') {
                posts.sort((a, b) => (b.upvotes + b.comments) - (a.upvotes + a.comments));
            }

            renderPosts();
            showToast(`${titleMap[name] || 'Popular'} loaded`);
        }

        function setupTabListeners() {
            navButtons.forEach(btn => {
                btn.addEventListener('click', () => activateTab(btn.dataset.tab));
            });
            sidebarButtons.forEach(btn => {
                btn.addEventListener('click', () => activateTab(btn.dataset.tab));
            });
        }

        async function handleCreateSubmit() {
            const rawTitle = postTitleInput.value.trim();
            const description = postDescInput.value.trim();
            const tags = getSelectedTags();

            if (!rawTitle || !description) {
                formError.textContent = 'Enter a title and a short description.';
                return;
            }

            if (tags.length === 0) {
                formError.textContent = 'Select at least one category.';
                return;
            }

            formError.textContent = '';

            const finalImage = uploadedImageDataUrl || generateImageFromContext(rawTitle, description);
            const title = `WE GOT ${rawTitle} BEFORE GTA 6`;

            const draft = {
                title,
                description,
                image: finalImage,
                tags,
                badge: tags[0],
                author: `@${currentUsername || 'You'}`
            };

            if (!currentUsername) {
                pendingCreateDraft = draft;
                usernameModal.classList.add('open');
                usernameModal.setAttribute('aria-hidden', 'false');
                usernameInput.focus();
                showToast('Enter a username to post.');
                return;
            }

            await createPostWithDraft({
                ...draft,
                author: `@${currentUsername}`
            });
        }

        function initializeTheme() {
            const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
            document.body.setAttribute('data-theme', storedTheme);
            modeToggle.textContent = storedTheme === 'dark' ? '🌙' : '☀️';
        }

        function toggleTheme() {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', nextTheme);
            localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
            modeToggle.textContent = nextTheme === 'dark' ? '🌙' : '☀️';
        }

        createBtn.addEventListener('click', openCreateModal);
        cancelCreateBtn.addEventListener('click', closeCreateModal);
        modalCloseBtn.addEventListener('click', closeCreateModal);
        submitCreateBtn.addEventListener('click', handleCreateSubmit);

        createModal.addEventListener('click', (event) => {
            if (event.target === createModal || event.target.dataset.close === 'true') {
                closeCreateModal();
            }
        });

        postTitleInput.addEventListener('input', () => {
            titleCount.textContent = String(postTitleInput.value.length);
            if (formError.textContent) formError.textContent = '';
        });

        postDescInput.addEventListener('input', () => {
            descCount.textContent = String(postDescInput.value.length);
            if (formError.textContent) formError.textContent = '';
        });

        uploadDropzone.addEventListener('click', () => postImageInput.click());
        uploadDropzone.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                postImageInput.click();
            }
        });

        postImageInput.addEventListener('change', async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const dataUrl = await readFileAsDataURL(file);
            setUploadPreview(dataUrl);
        });

        ['dragenter', 'dragover'].forEach((name) => {
            uploadDropzone.addEventListener(name, (event) => {
                event.preventDefault();
                uploadDropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach((name) => {
            uploadDropzone.addEventListener(name, (event) => {
                event.preventDefault();
                uploadDropzone.classList.remove('dragover');
            });
        });

        uploadDropzone.addEventListener('drop', async (event) => {
            const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (!file) return;
            const dataUrl = await readFileAsDataURL(file);
            setUploadPreview(dataUrl);
        });

        modeToggle.addEventListener('click', toggleTheme);

        usernameInput.addEventListener('input', () => {
            if (usernameError.textContent) usernameError.textContent = '';
        });

        saveUsernameBtn.addEventListener('click', handleSaveUsername);
        closeUsernameModalBtn.addEventListener('click', closeUsernameModal);
        usernameModal.addEventListener('click', (event) => {
            if (event.target === usernameModal) {
                closeUsernameModal();
            }
        });

        loginBtn.addEventListener('click', openAuthSheet);
        signUpBtn.addEventListener('click', openAuthSheet);
        closeAuthSheet.addEventListener('click', closeAuth);
        authSheet.addEventListener('click', (event) => {
            if (event.target === authSheet) closeAuth();
        });

        authOptions.forEach((option) => {
            option.addEventListener('click', () => {
                closeAuth();
                completeSocialLogin(option.dataset.provider);
            });
        });

        document.getElementById('searchInput').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                showToast(`Searching for "${event.target.value}"`);
            }
        });

        pollChoices.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            pollChoices.querySelectorAll('button').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            pollResults.textContent = `You voted for "${button.textContent.trim()}".`;
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && createModal.classList.contains('open')) {
                closeCreateModal();
            }
        });

        async function initializeFeed() {
            await loadPostsFromServer();
            activateTab('popular');
        }

        setupTabListeners();
        initializeTheme();
        requireUsernameOnFirstVisit();
        initializeFeed();

        let loading = false;
        document.querySelector('.content').addEventListener('scroll', async () => {
            const container = document.querySelector('.content');
            if (loading) return;
            if (container.scrollHeight - container.scrollTop - container.clientHeight < 120) {
                loading = true;
                await loadPostsFromServer();
                renderPosts();
                loading = false;
            }
        });
    