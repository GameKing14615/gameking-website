import re

with open('d:/Python/Internal Dash board Project/index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Make the specific replacements
html_content = re.sub(r'href="styles\.css[^"]*"', 'href="/static/dashy/styles.css"', html_content)
html_content = re.sub(r'src="app\.js[^"]*"', 'src="/static/dashy/app.js"', html_content)
html_content = html_content.replace('assets/dashy-icon.svg', '/static/dashy/dashy-icon.svg')
# Remove manifest
html_content = re.sub(r'<link rel="manifest" href="manifest\.webmanifest"\s*/?>', '', html_content)
# Remove service worker if exists
html_content = re.sub(r'<script[^>]*>\s*if\s*\(\'serviceWorker\'\s*in\s*navigator\).*?</script>', '', html_content, flags=re.DOTALL)

# Tokenize HTML
tokens = re.findall(r'(<!--.*?-->|<[^>]+>|[^<]+)', html_content, flags=re.DOTALL)

output = []
indent_level = 0
inline_tags = {'strong', 'b', 'em', 'i', 'span', 'small', 'a', 'button', 'title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'option', 'li', 'td', 'th'}
void_tags = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

def format_tag(tag_str, indent):
    is_end_tag = tag_str.startswith('</')
    if is_end_tag or tag_str.startswith('<!'):
        return '  ' * indent + tag_str

    inner = tag_str[1:-1]
    is_self_closing = False
    if inner.endswith('/'):
        is_self_closing = True
        inner = inner[:-1]
    
    match = re.match(r'^([a-zA-Z0-9\-]+)\s*(.*)$', inner, re.DOTALL)
    if not match:
        return '  ' * indent + tag_str
        
    tag_name, attrs_str = match.groups()
    attr_matches = re.findall(r'([a-zA-Z0-9\-:]+(?:="[^"]*"|=\'[^\']*\')?)', attrs_str)
    
    if len(attr_matches) > 3:
        res = '  ' * indent + f'<{tag_name}'
        for attr in attr_matches:
            res += f'\n{"  " * (indent + 1)}{attr}'
        if is_self_closing:
            res += f'\n{"  " * indent}/>'
        else:
            res += f'\n{"  " * indent}>'
        return res
    else:
        # Avoid double spacing but keep identical case
        return '  ' * indent + tag_str

final_lines = []

i = 0
while i < len(tokens):
    tok = tokens[i].strip()
    if not tok:
        i += 1
        continue
        
    if tok.startswith('</'):
        indent_level = max(0, indent_level - 1)
        final_lines.append(format_tag(tok, indent_level))
    elif tok.startswith('<!'):
        final_lines.append('  ' * indent_level + tok)
    elif tok.startswith('<'):
        inner = tok[1:-1]
        is_self_closing = inner.endswith('/')
        tag_name_match = re.match(r'/?([a-zA-Z0-9\-]+)', inner)
        tag_name = tag_name_match.group(1).lower() if tag_name_match else ''
        
        is_void = is_self_closing or (tag_name in void_tags)
        
        collapsed = False
        if not is_void:
            # Check empty tag
            if i + 1 < len(tokens):
                next_tok = tokens[i+1].strip()
                if next_tok == f'</{tag_name}>':
                    fmt_start = format_tag(tok, 0)
                    final_lines.append('  ' * indent_level + f'{fmt_start}</{tag_name}>')
                    i += 1
                    collapsed = True
            
            # Check inline tag with short text
            if not collapsed and i + 2 < len(tokens):
                next_tok = tokens[i+1].strip()
                next_next_tok = tokens[i+2].strip()
                if not next_tok.startswith('<') and next_next_tok == f'</{tag_name}>' and len(next_tok) < 100 and tag_name in inline_tags:
                    # Collapse!
                    fmt_start = format_tag(tok, 0)
                    final_lines.append('  ' * indent_level + f'{fmt_start}{next_tok}</{tag_name}>')
                    i += 2
                    collapsed = True
                    
        if not collapsed:
            final_lines.append(format_tag(tok, indent_level))
            if not is_void:
                indent_level += 1
    else:
        # Text
        if tok:
            final_lines.append('  ' * indent_level + tok)
            
    i += 1

with open('d:/Python/Internal Dash board Project/dashy.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(final_lines) + '\n')
