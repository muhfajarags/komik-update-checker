from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import csv
import os
import re
from webdriver_manager.chrome import ChromeDriverManager

options = Options()
options.add_argument('--headless')  
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

urls = [
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

old_data = {}
if os.path.exists("status.csv"):
    with open("status.csv", "r", encoding="utf-8") as file:
        reader = csv.reader(file)
        next(reader)  # Lewati header
        for row in reader:
            if len(row) == 2:
                old_data[row[0]] = row[1]

new_data = {}
updated_titles = []
updates_with_urls = []

for url in urls:
    driver.get(url)
    try:
        title = driver.find_element(By.XPATH, "//*[@id='Judul']/h1/span").text
        chapter_full = driver.find_element(By.XPATH, "//*[@id='daftarChapter']/tr[2]/td[1]/a/span").text
        chapter = " ".join(chapter_full.split()[:2])  # Ambil hanya dua kata pertama
        new_data[title] = chapter
        
        old_chapter_number = re.search(r'\d+', old_data.get(title, '0'))
        new_chapter_number = re.search(r'\d+', chapter)
        
        if old_chapter_number and new_chapter_number:
            old_chapter_number = int(old_chapter_number.group())
            new_chapter_number = int(new_chapter_number.group())
            
            if new_chapter_number > old_chapter_number:
                new_chapters = new_chapter_number - old_chapter_number
                updated_titles.append((title, new_chapters))
                updates_with_urls.append((title, new_chapters, url))
    except Exception as e:
        print(f"Gagal mengambil data dari {url}: {e}")

if updates_with_urls:
    print("Ada update baru!")
    for title, new_chapters, url in updates_with_urls:
        print(f"{title} memiliki {new_chapters} episode baru - {url}")
    
    confirm = input("Apakah ingin memperbarui status.csv? (y/n): ")
    if confirm.lower() == 'y':
        with open("status.csv", "w", encoding="utf-8", newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["Title", "Chapter"])
            for title, chapter in new_data.items():
                writer.writerow([title, chapter])
        print("Data diperbarui di status.csv")
    else:
        print("Data tidak diperbarui")
else:
    print("Tidak ada update baru")

driver.quit()