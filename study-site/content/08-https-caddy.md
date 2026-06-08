# 08. HTTPS & 도메인 (Caddy)

## 한 줄 요약
도메인을 서버 IP로 연결(DNS A레코드)하고, **Caddy**를 리버스 프록시로 띄워 **Let's Encrypt 인증서를 자동 발급**받아 `https://...`로 서비스했다.

## 핵심 개념 (왜)
- **DNS A 레코드:** `도메인 → IP` 매핑. 이게 없으면 도메인이 어디도 안 가리킨다.
- **HTTPS/TLS·Let's Encrypt(ACME):** 무료 인증서를 자동 발급/갱신. **IP에는 발급 안 되고 도메인(이름)에만** 발급 → HTTPS엔 도메인 필수.
- **리버스 프록시:** 앞단(Caddy)이 80/443을 받아 뒤의 앱(:8000)으로 넘김. TLS 종료를 프록시가 담당.
- **보안 컨텍스트(secure context):** 브라우저는 **마이크(`getUserMedia`)를 HTTPS 또는 localhost에서만** 허용 → `http://공인IP`에선 음성 입력이 막힌다. **그래서 HTTPS가 필요**.

## 우리가 한 것 (어떻게)
```bash
# 1) DNS: 도메인(가비아) A 레코드 → 서버 공인 IP  (강사 제공 도메인은 이미 연결돼 있었음)
dig +short sh.chris-cloud.com        # → 서버 IP 나오면 준비됨
# 2) ACG: 인바운드 80, 443 추가 (인증서 발급 + HTTPS)
# 3) 서버에서 Caddy (docker, 호스트 네트워크) — 짧은 줄 + 백슬래시
docker run -d --name caddy --restart unless-stopped \
  --network host \
  -v caddy_data:/data \
  caddy:2 \
  caddy reverse-proxy --from sh.chris-cloud.com --to localhost:8000
# 4) 확인
docker logs caddy                    # "certificate obtained" / validations succeeded
curl -sI https://sh.chris-cloud.com/health     # 200 + http→https 308 리다이렉트
bash smoke.sh https://sh.chris-cloud.com       # 7/7 🟢
```
- Caddy가 `--from`이 도메인이면 **자동으로 HTTPS** + 인증서 관리 + 80→443 리다이렉트.

## 막혔던 점 → 해결
- **"도메인 줬는데 안 됨"** → 받은 건 **공인 IP**(이름 아님). HTTPS엔 도메인 필요. (강사 도메인 `sh.chris-cloud.com`가 이미 IP로 연결돼 있어 DNS 단계는 통과)
- **`http:sh,chris-cloud.com` 오타** → 실제는 서브도메인 `sh.chris-cloud.com`. `dig`로 IP 매핑 확인.
- **긴 docker 명령 줄바꿈으로 깨짐**(`--to` 다음에 끊겨 `localhost:8000`이 따로 실행) → `docker rm -f caddy` 후 **백슬래시 짧은 줄**로 재실행.

## 셀프체크
1. 왜 IP로는 HTTPS(자물쇠)를 못 붙이나?
2. `http://공인IP:8000`에서 음성 입력이 막히는 이유는?
3. 리버스 프록시(Caddy)가 하는 일을 한 줄로?
