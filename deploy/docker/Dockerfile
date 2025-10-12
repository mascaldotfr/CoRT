FROM debian:trixie

RUN apt-get update && \
	    apt-get install -y --no-install-recommends \
	    ca-certificates \
	    caddy \
	    cron \
	    procps \
	    sudo \
	    git \
	    python3 \
	    python3-bs4 \
	    php-fpm \
	    php-cli \
	    php-sqlite3

# Create a dedicated user
RUN groupadd -r cort && \
    useradd -r -g cort -s /usr/sbin/nologin cort

# Copy caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Configure caddy root
RUN mkdir -p /var/www/html/CoRT && \
	chown -R caddy:caddy /var/www && \
	chown cort:cort /var/www/html/CoRT

# git clone
# and remove preload linking to the official API
RUN sudo -u cort git clone https://github.com/mascaldotfr/CoRT.git /var/www/html/CoRT && \
	sudo -u cort sed -i '/<link rel="preload"/d' /var/www/html/CoRT/*.html
# XXX Note that you can't git pull or it will overwrite some or even all the
# above changes. See ̀ /deploy/README.md`. Also you will need to modify
# `api/bin/collect/submit.php` if the website and the API aren't on the same
# domain.

# Configure the trainer saved setup db (must be writeable by php running as
# www-data) and stats.
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainer_saved_setups.txt
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainer_saved_setups.txt.gz
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainerstats.json
RUN touch -d "1 week ago" /var/www/html/CoRT/api/var/trainerstats.json.gz
RUN chown www-data /var/www/html/CoRT/api/var/trainer_saved_setups.txt* /var/www/html/CoRT/api/var/trainerstats.json*

# Copy cron job script (will be run by cort user)
COPY cort-cron /etc/cron.d/cort-cron
RUN chmod 0644 /etc/cron.d/cort-cron

# Open port 80
EXPOSE 80

# Start cron, php-fpm and caddy
CMD ["sh", "-c", "service cron start; service php8.4-fpm start; exec sudo -u caddy caddy run --config /etc/caddy/Caddyfile"]
