FROM debian:trixie

RUN apt-get update && \
	    apt-get install -y --no-install-recommends \
	    ca-certificates \
	    caddy \
	    cron \
	    procps \
	    sudo \
	    git \
	    php-cli \
	    php-curl \
	    php-fpm \
	    php-sqlite3 \
	    php-zip \
	    composer

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

# Install required php dependencies (only needed for warstatus)
WORKDIR /var/www/html/CoRT/
RUN sudo -u cort composer install

# Configure the trainer saved setup db (must be writeable by php running as
# www-data) and stats.
RUN touch -d "1 week ago" 	api/var/trainer_saved_setups.txt \
				api/var/trainer_saved_setups.txt.gz \
				api/var/trainerstats.json \
				api/var/trainerstats.json.gz \
				api/var/events_dump.csv \
				api/var/events_dump.csv.gz
RUN chown www-data 	api/var/trainer_saved_setups.txt* \
			api/var/trainerstats.json* \
			api/var/events_dump.csv*


# Copy cron job script (will be run by cort user)
COPY cort-cron /etc/cron.d/cort-cron
RUN chmod 0644 /etc/cron.d/cort-cron

# Open port 80
EXPOSE 80

# Start cron, php-fpm and caddy
CMD ["sh", "-c", "service cron start; service php8.4-fpm start; exec sudo -u caddy caddy run --config /etc/caddy/Caddyfile"]
