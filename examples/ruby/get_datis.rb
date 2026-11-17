#!/usr/bin/env ruby
require "json"
require "net/http"
require "uri"

key = ENV["ATIS_RELAY_API_KEY"]

if key.to_s.strip.empty?

  warn "Set ATIS_RELAY_API_KEY to your ATIS Relay API key"
  exit 1
end

uri = URI("https://atisrelay.com/api/atis?icao=KSFO")
request = Net::HTTP::Get.new(uri)
request["X-Api-Key"] = key

response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
  http.request(request)
end

unless response.is_a?(Net::HTTPSuccess)

  warn "HTTP #{response.code}: #{response.body}"
  exit 1
end

puts JSON.pretty_generate(JSON.parse(response.body))
