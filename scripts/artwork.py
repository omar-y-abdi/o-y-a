"""Regenerate the committed brand PNGs from the site's actual CSS and artwork.
Requires Python Playwright and Chromium; not needed for the site's build.
"""
from pathlib import Path
import sys
import os
import shutil
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from render_support import document
from playwright.sync_api import sync_playwright
import cairosvg

public = ROOT/'public'; (public/'social').mkdir(exist_ok=True)
svg=(public/'favicon.svg').read_text()
cairosvg.svg2png(bytestring=svg.encode(),write_to=str(public/'apple-touch-icon.png'),output_width=180,output_height=180)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'), args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':630},device_scale_factor=1)
    page.set_content(document('/'))
    page.evaluate('''() => {
      const machine = document.querySelector('[data-machine]').outerHTML;
      document.body.innerHTML = `<div class="social-frame"><div class="social-copy"><div class="social-top">${document.querySelector('.brand')?.innerHTML || 'omaryusuf.se'}</div><h1>Omar<br>Yusuf<span>.</span></h1><p>Teknik med hjärna.<br>Lite bus i systemet.</p><div class="social-bottom">omaryusuf.se <span>↗</span></div></div><div class="social-machine">${machine}</div></div>`;
    }''')
    page.add_style_tag(content='''
      html, body {width:1200px;height:630px;overflow:hidden;background:#fff0b3;}
      .social-frame {width:1200px;height:630px;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:40px 66px;gap:20px;}
      .social-top {font-size:16px;font-weight:700;letter-spacing:.02em;margin-bottom:26px;}
      .social-copy h1 {font-size:132px;line-height:.88;letter-spacing:-.085em;margin:0 0 24px;font-weight:800;}
      .social-copy h1 span {color:#234ce7;}
      .social-copy p {font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.035em;}
      .social-bottom {font-size:17px;font-weight:700;margin-top:24px;display:flex;align-items:center;gap:18px;}
      .social-bottom span {font-size:24px;}
      .social-machine {width:520px;}
      .machine-stage {width:520px;min-height:500px;transform:scale(.97);transform-origin:center;}
      .machine-note {display:none;}.machine-under{font-size:10px;} .joy-ball {animation:none!important;}
      .machine-button {opacity:1!important;}
      .social-copy .flower {display:none;}
    ''')
    page.screenshot(path=str(public/'social/omar-yusuf.png'))
    browser.close()
print('Brand assets generated: SVG favicon, 180px icon and 1200x630 social image.')
