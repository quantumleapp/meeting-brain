# 07. Ncloud 배포

## 한 줄 요약
Ncloud **Ubuntu 서버 1대**에 코드를 올리고 `docker compose`로 앱+DB를 띄운 뒤, **ACG(방화벽)에 앱 포트만 열고** 스모크 테스트로 확인했다.

## 핵심 개념 (왜)
- **공인 IP vs 사설 IP:** 외부에서 접속하려면 공인 IP 필요. 사설 IP는 내부망용.
- **SSH 키 인증(.pem):** 비밀번호 대신 **키 파일**로 로그인. 서버가 비번 로그인을 막아두면 키가 유일한 길. 키 파일은 권한 `600`.
- **ACG (Access Control Group = 방화벽):** **최소 개방** 원칙. 앱 포트(8000)만 인바운드 허용, DB 포트(5432)는 **절대 외부 개방 금지**.
- **스모크 테스트:** 배포 후 핵심 기능이 도는지 빠르게 확인하는 점검(예: `/health`, `/ask`).

## 우리가 한 것 (어떻게)
```bash
# 1) 로컬 → 서버 코드 전송 (키로)
rsync -av -e "ssh -i ~/Downloads/키.pem" --exclude .venv --exclude .git \
  "/.../meeting-brain" root@<서버IP>:~/
# 2) 서버 접속 & 도커 데몬
ssh -i ~/Downloads/키.pem root@<서버IP>
systemctl start docker && systemctl enable docker
# 3) 기동
cd ~/meeting-brain && docker compose up -d --build && docker compose ps
# 4) 시드 (seed/는 이미지에 없으니 복사 후 실행)
docker compose cp ./seed app:/code/seed
docker compose exec -e PYTHONPATH=/code app python seed/seed.py
# 5) ACG: 인바운드 8000 만 (5432 금지) — 콘솔
# 6) 스모크 (로컬에서 서버 대상)
bash smoke.sh http://<서버IP>:8000     # 7/7 🟢
```
> 상세 절차·롤백·비용 규칙은 `SERVER_RUNBOOK.md` 참고.

## 막혔던 점 → 해결
- **비밀번호 로그인 거부** → 서버가 키 전용. 해결: **`ssh -i .pem`**, rsync도 `-e "ssh -i .pem"`.
- **`Cannot connect to the Docker daemon`** → 데몬 꺼짐. 해결: `systemctl start docker`(+`enable`).
- **긴 명령 붙여넣기 때 줄바꿈이 껴서 깨짐** → 해결: **짧은 줄 + 백슬래시(`\`)**.
- **로컬 창 vs 서버 창 혼동** → 프롬프트가 `#`(root 서버) / `%`(로컬 맥)인지로 구분.

## 셀프체크
1. 비밀번호 대신 `.pem`을 쓰는 이유와, 키 파일 권한을 `600`으로 두는 이유는?
2. ACG에서 8000은 열고 5432는 막는 이유는?
3. 코드를 서버에 올리는 `rsync`는 로컬과 서버 중 어디서 실행하나?
