from flask import Flask, render_template, request, jsonify, send_from_directory
import threading
import time
import csv
import os
import re
from PIL import Image
from io import BytesIO
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

app = Flask(__name__)

MANGA_LIST = [
    "https://komiku.id/manga/from-goblin-to-goblin-god/",
    "https://komiku.id/manga/tsuihou-sareta-tenshou-juu-kishi-wa-game-chishiki-de-musou-suru/",
    "https://komiku.id/manga/solo-farming-in-the-tower/",
    "https://komiku.id/manga/there-are-no-bad-heroes-in-this-world/",
    "https://komiku.id/manga/eternally-regressing-knight/",
    "https://komiku.id/manga/survive-as-a-barbarian-in-the-game/",
    "https://komiku.id/manga/the-indomitable-martial-king/",
    "https://komiku.id/manga/devil-returns-to-school-days/",
    "https://komiku.id/manga/evolution-begins-with-a-big-tree/",
    "https://komiku.id/manga/bones/"
]

COVER_DIR = "static/covers"
if not os.path.exists(COVER_DIR):
    os.makedirs(COVER_DIR)

DEFAULT_COVER = "static/default_cover.png"
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists(DEFAULT_COVER):
    with open(DEFAULT_COVER, "w") as f:
        f.write("Placeholder")

last_scan_result = {
    "timestamp": None,
    "updates": [],
    "all_manga": []
}

def resize_cover_image(image_url, manga_title):
    try:
        safe_title = re.sub(r'[^a-zA-Z0-9]', '_', manga_title)
        filename = f"{safe_title}.jpg"
        file_path = os.path.join(COVER_DIR, filename)
        
        if os.path.exists(file_path):
            return f"/{file_path}"
        
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img = img.convert("RGB")
            width, height = img.size
            ratio = min(400 / width, 600 / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', (400, 600), (240, 240, 240))
            x = (400 - new_width) // 2
            y = (600 - new_height) // 2
            canvas.paste(img, (x, y))
            canvas.save(file_path, quality=85)
            return f"/{file_path}"
        
        return image_url
    except Exception:
        return image_url

def check_manga_updates():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-infobars')
    options.add_argument('--disable-extensions')
    options.add_argument('--blink-settings=imagesEnabled=true')

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    old_data = {}
    if os.path.exists("status.csv"):
        with open("status.csv", "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            next(reader)
            for row in reader:
                if len(row) >= 2:
                    old_data[row[0]] = row[1]

    new_data = {}
    updated_titles = []
    all_manga_info = []

    for url in MANGA_LIST:
        try:
            driver.get(url)
            time.sleep(2)
            title = driver.find_element(By.XPATH, "//*[@id='Judul']/h1/span").text
            manga_slug = url.rstrip('/').split('/')[-1]

            try:
                cover_img = driver.find_element(By.XPATH, "//*[@id='Informasi']/div/img").get_attribute("src")
                if ".jpg" in cover_img:
                    cover_img = cover_img.split(".jpg")[0] + ".jpg"
                elif ".png" in cover_img:
                    cover_img = cover_img.split(".png")[0] + ".png"
                processed_cover = resize_cover_image(cover_img, title)
            except Exception:
                processed_cover = f"/{DEFAULT_COVER}"
            
            chapter_full = driver.find_element(By.XPATH, "//*[@id='daftarChapter']/tr[2]/td[1]/a/span").text
            chapter_url = driver.find_element(By.XPATH, "//*[@id='daftarChapter']/tr[2]/td[1]/a").get_attribute("href")
            chapter = " ".join(chapter_full.split()[:2])
            new_data[title] = chapter

            chapter_number_match = re.search(r'\d+', chapter)
            chapter_number = int(chapter_number_match.group()) if chapter_number_match else 0

            last_read_chapter = 0
            if title in old_data:
                old_chapter_match = re.search(r'\d+', old_data[title])
                if old_chapter_match:
                    last_read_chapter = int(old_chapter_match.group())

            first_unread_chapter = last_read_chapter + 1
            unread_chapter_url = f"https://komiku.id/{manga_slug}-chapter-{first_unread_chapter}/"

            manga_info = {
                "title": title,
                "cover": processed_cover,
                "latest_chapter": chapter,
                "chapter_url": chapter_url,
                "manga_url": url,
                "last_read_chapter": last_read_chapter,
                "first_unread_chapter": first_unread_chapter,
                "unread_chapter_url": unread_chapter_url,
                "manga_slug": manga_slug
            }
            all_manga_info.append(manga_info)

            if chapter_number > last_read_chapter:
                new_chapters = chapter_number - last_read_chapter
                updated_titles.append({
                    "title": title,
                    "new_chapters": new_chapters,
                    "url": url,
                    "chapter_url": chapter_url,
                    "unread_chapter_url": unread_chapter_url,
                    "first_unread_chapter": first_unread_chapter,
                    "last_read_chapter": last_read_chapter,
                    "cover": processed_cover,
                    "manga_slug": manga_slug
                })

        except Exception as e:
            print(f"Gagal mengambil data dari {url}: {e}")

    last_scan_result["timestamp"] = time.strftime("%d %B %Y, %H:%M:%S")
    last_scan_result["updates"] = updated_titles
    last_scan_result["all_manga"] = all_manga_info

    driver.quit()
    
    return updated_titles, all_manga_info

@app.route('/mark_as_read', methods=['POST'])
def mark_as_read():
    try:
        data = request.get_json()
        title = data.get('title')
        chapter = data.get('chapter')
        
        if not title or not chapter:
            return jsonify({
                "success": False,
                "error": "Title dan chapter diperlukan"
            })
        
        all_manga = last_scan_result.get("all_manga", [])
        for manga in all_manga:
            if manga["title"] == title:
                manga["last_read_chapter"] = int(chapter)
                break
        
        update_status_csv(all_manga)
        
        return jsonify({
            "success": True,
            "message": f"Manga '{title}' ditandai sebagai dibaca hingga chapter {chapter}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })
    
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/check_updates', methods=['POST'])
def check_updates():
    try:
        updates, all_manga = check_manga_updates()
        update_status_csv(all_manga)
        
        return jsonify({
            "success": True,
            "timestamp": last_scan_result["timestamp"],
            "updates": updates,
            "all_manga": all_manga
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

def update_status_csv(manga_list):
    with open("status.csv", "w", encoding="utf-8", newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Title", "Chapter"])
        for manga in manga_list:
            writer.writerow([manga["title"], manga["latest_chapter"]])

@app.route('/get_last_scan')
def get_last_scan():
    return jsonify({
        "timestamp": last_scan_result["timestamp"],
        "updates": last_scan_result["updates"],
        "all_manga": last_scan_result["all_manga"]
    })

@app.route('/add_manga', methods=['POST'])
def add_manga():
    data = request.get_json()
    url = data.get('url')
    
    if url and url not in MANGA_LIST:
        MANGA_LIST.append(url)
        return jsonify({"success": True})
    
    return jsonify({"success": False})

if __name__ == '__main__':
    if not os.path.exists("static"):
        os.makedirs("static")
    
    threading.Thread(target=check_manga_updates).start()
    app.run(debug=True, host='0.0.0.0', port=5000)