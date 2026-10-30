<?php

/*
 * MultiWriter writes data to a file and automatically creates compressed versions
 * (.gz, and .zst if available) alongside it.
 * Use write() for creating new files, append() for adding lines to existing ones.
 *
 * Files are replaced atomically (temporary file + rename), so readers never
 * see an empty or truncated file. This requires the PHP user to be able to
 * create files in the target directory.
 *
 * EXAMPLES:
 * require_once "MultiWriter.php";
 * MultiWriter::write("output.json", $json_data);
 * MultiWriter::append("../../var/trainer_saved_setups.txt", "some text\n");
 */

/* MAINTENANCE GUIDELINES FOR AI ASSISTANTS AND DEVELOPERS
 *
 * This class is useful if you serve CoRT directly on your own server.
 * zstd compression may be fairly slow, don't use that class if you're serving the API behind a CDN, or at least disable gzip.
 *
 * Note that this class is used in many places, so if you plan to not use that class, check the other PHP files in "/api/bin"
 *
 */

/*
 * MAINTENANCE GUIDELINES FOR AI ASSISTANTS AND DEVELOPERS
 *
 * This class is useful when serving CoRT directly from your own server.
 * However, Zstandard (zstd) compression can be relatively CPU-intensive.
 * Avoid using this class when serving the API behind a CDN, or at least
 * disable gzip compression in that setup.
 *
 * This class is referenced in multiple places throughout the project.
 * If you decide to stop using it, make sure to review the other PHP files
 * in the "/api/bin" directory to identify and update any remaining usages.
 */

class MultiWriter
{
	// name: just the basename (like "data.json" or "myfile.txt"), we add .gz/.zst
	// data: the content to write
	public static function write(string $name, string $data): void
	{
		self::atomic_put($name, $data);
		self::atomic_put($name . ".gz", gzencode($data, 9));

		if (function_exists("zstd_compress")) {
			self::atomic_put($name . ".zst", zstd_compress($data, 15));
		}
	}

	// path: where to add it
	// data: what you wanna add
	public static function append(string $path, string $data): void
	{
		file_put_contents($path, $data, FILE_APPEND | LOCK_EX);

		$gz = gzopen($path . ".gz", "a");
		gzwrite($gz, $data);
		gzclose($gz);

		// Appending on zstd make filesize bigger than it should, so we
		// slurp the full original file and recompress everything
		if (function_exists("zstd_compress")) {
			$data = file_get_contents($path);
			self::atomic_put($path . ".zst", zstd_compress($data, 15));
		}
	}

	// Write to a temporary file in the same directory, then rename it over
	// the target: rename() is atomic on the same filesystem.
	private static function atomic_put(string $path, string $data): void
	{
		$tmp = $path . ".tmp." . getmypid() . "." . bin2hex(random_bytes(4));
		if (file_put_contents($tmp, $data) !== strlen($data) || !rename($tmp, $path)) {
			@unlink($tmp);
			error_log("MultiWriter: failed to write $path, previous version kept");
		}
	}
}

?>
