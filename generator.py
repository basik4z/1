import os
import sys
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ===== 1. НАСТРОЙКИ УСТРОЙСТВ =====
DEVICE_TYPES = [
    {
        'type': 'tablet',
        'ua': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'width': 1024,
        'height': 768
    },
    {
        'type': 'phone',
        'ua': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'width': 390,
        'height': 844
    },
    {
        'type': 'desktop',
        'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'width': 1920,
        'height': 1080
    }
]

def get_device_for_account(index, total):
    """Распределяем аккаунты по типам устройств"""
    third = total // 3
    if index <= third:
        return DEVICE_TYPES[0]  # Планшет
    elif index <= 2 * third:
        return DEVICE_TYPES[1]  # Телефон
    else:
        return DEVICE_TYPES[2]  # Компьютер

def register_account(login, password, device):
    """Регистрация с эмуляцией устройства"""
    
    options = webdriver.ChromeOptions()
    
    # Эмуляция устройства
    options.add_argument(f'--user-agent={device["ua"]}')
    options.add_argument(f'--window-size={device["width"]},{device["height"]}')
    
    # Режим без окна (для сервера)
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f'📱 Регистрация {login} на {device["type"]}')
        driver.get('https://www.roblox.com/register')
        time.sleep(5)
        
        # Заполняем форму
        wait = WebDriverWait(driver, 10)
        
        # Логин
        username_field = wait.until(EC.presence_of_element_located((By.ID, 'signup-username')))
        username_field.send_keys(login)
        
        # Пароль
        password_field = driver.find_element(By.ID, 'signup-password')
        password_field.send_keys(password)
        
        # Дата рождения (2000 год)
        driver.find_element(By.ID, 'signup-birthday-day').send_keys('01')
        driver.find_element(By.ID, 'signup-birthday-month').send_keys('01')
        driver.find_element(By.ID, 'signup-birthday-year').send_keys('2000')
        
        # РЕШЕНИЕ КАПЧИ (через 2captcha)
        captcha_key = os.environ.get('TWOCAPTCHA_KEY')
        if captcha_key:
            try:
                from twocaptcha import TwoCaptcha
                solver = TwoCaptcha(captcha_key)
                
                # Находим site_key капчи
                arkose = driver.find_element(By.CLASS_NAME, 'arkose')
                site_key = arkose.get_attribute('data-key')
                
                print(f'🧩 Решаем капчу для {login}...')
                result = solver.arkose(site_key, url='https://www.roblox.com/register')
                driver.execute_script(f"document.getElementById('captcha').value = '{result['code']}'")
                time.sleep(2)
            except Exception as e:
                print(f'⚠️ Ошибка капчи: {e}')
        
        # Нажимаем регистрацию
        driver.find_element(By.ID, 'signup-button').click()
        time.sleep(5)
        
        # Проверяем успех
        if 'Home' in driver.title or 'Welcome' in driver.title:
            print(f'✅ {login}:{password} [{device["type"]}]')
            return {'login': login, 'password': password, 'device': device['type'], 'status': 'success'}
        else:
            print(f'❌ Ошибка регистрации {login}')
            return {'login': login, 'status': 'failed'}
            
    except Exception as e:
        print(f'❌ Ошибка для {login}: {e}')
        return {'login': login, 'status': 'error', 'error': str(e)}
    finally:
        driver.quit()

# ===== 2. ЗАПУСК =====
if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--index', type=int, required=True, help='Номер аккаунта')
    parser.add_argument('--total', type=int, default=150, help='Общее количество')
    args = parser.parse_args()
    
    # Определяем устройство
    device = get_device_for_account(args.index, args.total)
    
    # Генерируем логин и пароль
    login = f"watermelonQwerty{random.randint(1000, 9999)}{args.index}"
    password = ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))
    
    # Регистрируем
    result = register_account(login, password, device)
    
    if result.get('status') == 'success':
        with open('account.txt', 'w') as f:
            f.write(f"{result['login']}:{result['password']}:{result['device']}\n")
        sys.exit(0)
    else:
        sys.exit(1)