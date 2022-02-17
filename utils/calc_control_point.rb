#
# = calc_control_point.rb
#
# Calculate coordinates of control points of a Cubic Bézier curve for easing.
#
# Copyright:: Copyright (c) 2022 Polar Tech
# Author:: Polar Tech
# License:: MIT License
#
# == Usage
#
#   $ ruby calc_control_point.rb [options]
#
# == Command Example
#
#   $ ruby calc_control_point.rb sin 3 circular
#
# == Options
#
# - quadratic, quad, 2 - Calculate the coordinates for the quadratic easing
# - cubic, cube, 3     - Calculate the coordinates for the cubic easing
# - quartic, quart, 4  - Calculate the coordinates for the quartic easing
# - quintic, quint, 5  - Calculate the coordinates for the quintic easing
# - power, pow         - Calculate the coordinates for the quadratic, cubic, quartic, and quintic easing
# - sinusoidal, sinusoid, sine, sin  - Calculate the coordinates for the sinusoidal easing
# - exponential, exponent, expo, exp - Calculate the coordinates for the exponential easing
# - circular, circle, circ, cir      - Calculate the coordinates for the circular easing
#
# If no option is passed, calculate the coordinates for all cases.
#
# == Output
#
# Display the coordinates of the control points of the Cubic Bézier curve and
# differences between coordinates of a Cubic Bézier curve drawn from the control points and
# coordinates of a curve calculated from the easing function
# as text on the CLI.
#
# Multiple coordinates and differences are output.
# - max diff:
#   The maximum difference between the coordinates of the Cubic Bézier curve drawn from the control points and
#   the coordinates of the curve calculated from the easing function.
#   And the coordinates of the control points where the difference is smaller.
# - accum diff:
#   The accumulated absolute value of the difference between the coordinates of the Cubic Bézier curve drawn from the control points and
#   the coordinates of the curve calculated from the easing function.
#   And the coordinates of the control points where the difference is smaller.
# - median:
#   Coordinates of the control points that are in the middle of the max diff coordinates and the accum diff coordinates.
#
# In ease-out, only the coordinates are output since the differences are almost the same as the ease-in.
#
# == Ruby Version
#
# Confirmed to work with 2.7.x, 3.0.x, 3.1.x.
#
# == Notes
#
# This utility program is created to study the specified easing values
# used in the {keySplines Visualizer}[https://polaretech.github.io/image-collection/utils/keysplines-visualizer.html].
#
# The calculation procedure and results are not rigorous.
#
# == References
#
# - http://robertpenner.com/easing/penner_chapter7_tweening.pdf
#
def main
  orders = []
  unsupported = []

  options = ARGV.empty? ? %w(pow sin exp cir) : ARGV

  options.each do |option|
    case option
    when 'power', 'pow'
      (2..5).each { |n| orders << [:pow, n.to_f] }
    when 'quadratic', 'quad', '2'
      orders << [:pow, 2.0]
    when 'cubic', 'cube', '3'
      orders << [:pow, 3.0]
    when 'quartic', 'quart', '4'
      orders << [:pow, 4.0]
    when 'quintic', 'quint', '5'
      orders << [:pow, 5.0]
    when 'sinusoidal', 'sinusoid', 'sine', 'sin'
      orders << [:sin]
    when 'exponential', 'exponent', 'expo', 'exp'
      orders << [:expo]
    when 'circular', 'circle', 'circ', 'cir'
      orders << [:circ]
    else
      unsupported << option
    end
  end

  orders.each do |order|
    result = calc_in(*order)
    output(*result.values_at(:coords, :diffs, :type, :n))

    result = calc_inout(*order)
    output(*result.values_at(:coords, :diffs, :type, :n))
  end

  unsupported.each do |option|
    puts %(INFO: The "#{option}" option is not supported.)
  end
end

class F
  # Calculate the coordinate of the Cubic Bézier curve
  def self.bezier(p1, p2, t = 0.5)
    a = 1 - t
    (3 * (a ** 2) * t * p1) + (3 * a * (t ** 2) * p2) + (t ** 3)
  end

  # Calculate the coordinate of the control point on the start side of the curve
  def self.bezier_p1(p2, curve, t = 0.5)
    a = 1 - t
    (curve - (3 * a * (t ** 2) * p2) - (t ** 3)) / (3 * (a ** 2) * t)
  end

  # Calculate the coordinate of the control point on the end side of the curve
  def self.bezier_p2(p1, curve, t = 0.5)
    a = 1 - t
    (curve - (3 * (a ** 2) * t * p1) - (t ** 3)) / (3 * a * (t ** 2))
  end

  # Easing function
  def self.easing_lambda(type)
    case type
    when :pow_in
      lambda { |x, n| x ** n }
    when :pow_inout
      lambda { |x, n| x < 0.5 ? 0.5 * (x * 2) ** n : 1 - 0.5 * ((1 - x) * 2) ** n }
    when :sin_in
      lambda { |x, *| 1 - Math.cos(x * Math::PI / 2) }
    when :sin_inout
      lambda { |x, *| 0.5 * (1 - Math.cos(x * Math::PI)) }
    when :expo_in
      lambda { |x, *| x == 0.0 ? 0.0 : 2.pow(10 * (x - 1)) }
    when :expo_inout
      lambda { |x, *| x == 0.0 || x == 1.0 ? x : x < 0.5 ? 0.5 * 2.pow(10 * ((x * 2) - 1)) : 1 - 0.5 * 2.pow(10 * ((1 - x) * 2 - 1)) }
    when :circ_in
      lambda { |x, *| 1 - Math.sqrt(1 - x ** 2) }
    when :circ_inout
      lambda { |x, *| x < 0.5 ? 0.5 * (1 - Math.sqrt(1 - (x * 2) ** 2)) : 0.5 * (Math.sqrt(1 - ((1 - x) * 2) ** 2) + 1) }
    end
  end
end

# :nodoc:

# Calculate the approximate x-coordinate of the midpoint of the curve
def calc_midpoint_x(type, n = nil)
  return 1 / Math.sqrt(2) if type == :circ_in

  # Roughly calculate the curvature and
  # return the position where the curvature value is the maximum
  # as the tentative x-coordinate of the midpoint
  dx = 0.1
  fe = F.easing_lambda(type)

  curvature = (0...1).step(dx).map do |x|
    dy = fe.call(x + dx, n) - fe.call(x, n)
    [dx, dy].min / [dx, dy].max
  end

  curvature.find_index(curvature.max) * dx + (dx / 2)
end

# Calculate the approximate x-coordinate of the control point
# on the end side of the ease-in curve
def calc_x2(y2, type, n = nil)
  # Calculate it from the tangent line at the end of the curve
  # and the given y-coordinate
  case type
  when :pow_in
    control_point2 = { slope: n }
  when :sin_in
    k = Math::PI / 2
    kk = 1 / k
    control_point2 = { slope: Math.sin(1.0 * k) / kk }
  when :expo_in
    control_point2 = { slope: 10 * Math.log(2) }
  when :circ_in
    return 1.0
  end

  control_point2[:intercept] = 1 - control_point2[:slope]
  (y2 - control_point2[:intercept]) / control_point2[:slope]
end

# Calculate the approximate x-coordinate of the control point
# on the start side of the ease-in-out curve
def calc_x1(type, n = nil)
  # Regarding the coordinates of the ease-in-out curve,
  #
  # when the coordinates of the control points are (0.0, 0.0, 1.0, 1.0),
  #   x = 0.3, y = 0.3
  # when the coordinates of the control points are (0.5, 0.0, 0.5, 1.0),
  #   x = 0.4, y = 0.3 *approximate values
  # when the coordinates of the control points are (1.0, 0.0, 0.0, 1.0),
  #   x = 0.5, y = 0.3 *approximate values
  #
  # Given the above, calculate the tentative x-coordinate of the control point
  # based on the correlation of the x-coordinate of the curve at y = 0.3
  from = 0.3
  to = 0.5
  fe = F.easing_lambda(type)
  x = (from...to).step(0.01).find { |x| fe.call(x, n) > from }
  (x - from) / (to - from)
end

# Calculate the differences between
# the coordinates of the curve drawn from the control points and
# the coordinates of the curve calculated from the easing function
def check_diff(x1, y1, x2, y2, type, n = nil)
  fe = F.easing_lambda(type)

  max_diff = 0
  accum_diff = 0

  (0..1).step(0.05) do |t|
    x = F.bezier(x1, x2, t)
    y = F.bezier(y1, y2, t)
    y_expected = fe.call(x, n)
    max_diff = [(y - y_expected).abs, max_diff].max
    accum_diff += (y - y_expected).abs
  end

  { max: max_diff, accum: accum_diff }
end

# Display calculated coordinates and differences
def output(coords, diffs, type, n = nil)
  type_name =
    case
    when type.start_with?('pow')
      case
      when n == 2.0 then 'Quadratic'
      when n == 3.0 then 'Cubic'
      when n == 4.0 then 'Quartic'
      when n == 5.0 then 'Quintic'
      end
    when type.start_with?('sin') then 'Sinusoidal'
    when type.start_with?('expo') then 'Exponential'
    when type.start_with?('circ') then 'Circular'
    end

  median_coords = coords[:max].zip(coords[:accum]).map { |v| v.sum / 2.0 }
  median_diffs = check_diff(*median_coords, type, n).values_at(:max, :accum)

  puts "************************"

  case
  when type.end_with?('in')
    puts " #{type_name} easeIn"
  when type.end_with?('inout')
    puts " #{type_name} easeInOut"
  end

  puts "************************"

  puts "--- max diff ---"
  puts "coords:"
  puts coords[:max].to_s
  puts "diffs: ([max, accum])"
  puts diffs[:max].to_s
  puts ""

  puts "--- accum diff ---"
  puts "coords:"
  puts coords[:accum].to_s
  puts "diffs: ([max, accum])"
  puts diffs[:accum].to_s
  puts ""

  puts "--- median ---"
  puts "coords:"
  puts median_coords.to_s
  puts "diffs: ([max, accum])"
  puts median_diffs.to_s
  puts ""

  return if type.end_with?('inout')

  puts "************************"
  puts " #{type_name} easeOut"
  puts "************************"

  puts "--- max diff ---"
  puts "coords:"
  puts coords[:max].map { |v| 1 - v }.rotate(2).to_s
  puts ""

  puts "-- accum diff ---"
  puts "coords:"
  puts coords[:accum].map { |v| 1 - v }.rotate(2).to_s
  puts ""

  puts "--- median ---"
  puts "coords:"
  puts median_coords.map { |v| 1 - v }.rotate(2).to_s
  puts ""
end

# Culculate the coordinates of the control points for the ease-in curve
def calc_in(type, n = nil)
  type = (type.to_s + '_in').to_sym

  # Each value of diffs is used to detect the minimum value of the difference,
  # so some large value is stored as the initial value
  diffs = { max: [100, nil], accum: [nil, 100] }
  coords = { max: [], accum: [] }

  fe = F.easing_lambda(type)

  y1 = 0.0

  temp_mid_x = calc_midpoint_x(type, n)

  # Search around the tentative coordinates to obtain the coordinates of the control points
  # that can draw a curve close to the expected shape
  (temp_mid_x - 0.1).step(temp_mid_x + 0.1, 0.00025) do |mid_x|
    curve_midpoint = {
      x: mid_x,
      y: fe.call(mid_x, n)
    }

    y2 = F.bezier_p2(y1, curve_midpoint[:y])

    temp_x2 = calc_x2(y2, type, n)

    (temp_x2 - 0.02).step(temp_x2 + 0.02, 0.0025) do |x2|
      x1 = F.bezier_p1(x2, curve_midpoint[:x])

      # What to do if the coordinates exceed the range of 0 to 1
      # next unless [x1, x2, y2].all? { |v| v.finite? }
      # next unless [x1, x2, y2].all? { |v| v.between?(0, 1) }
      x1, x2, y2 = [x1, x2, y2].map { |v| v.clamp(0.0, 1.0) }

      # In circular, x1 and y2 should be symmetrical
      next if type == :circ_in && x1.round(5) != (1 - y2).round(5)

      max_diff, accum_diff = check_diff(x1, y1, x2, y2, type, n).values_at(:max, :accum)

      if max_diff < diffs[:max][0]
        coords[:max] = [x1, y1, x2, y2]
        diffs[:max] = [max_diff, accum_diff]
      end

      if accum_diff < diffs[:accum][1]
        coords[:accum] = [x1, y1, x2, y2]
        diffs[:accum] = [max_diff, accum_diff]
      end
    end
  end

  { coords: coords, diffs: diffs, type: type, n: n }
end

# Culculate the coordinates of the control points for the ease-in-out curve
def calc_inout(type, n = nil)
  type = (type.to_s + '_inout').to_sym

  # Each value of diffs is used to detect the minimum value of the difference,
  # so some large value is stored as the initial value
  diffs = { max: [100, nil], accum: [nil, 100] }
  coords = { max: [], accum: [] }

  y1 = 0.0
  y2 = 1.0

  temp_x1 = calc_x1(type, n)

  # Search around the tentative coordinates to obtain the coordinates of the control points
  # that can draw a curve close to the expected shape
  (temp_x1 - 0.1).step(temp_x1 + 0.1, 0.00025) do |x1|
    x2 = 1 - x1

    max_diff, accum_diff = check_diff(x1, y1, x2, y2, type, n).values_at(:max, :accum)

    if max_diff < diffs[:max][0]
      coords[:max] = [x1, y1, x2, y2]
      diffs[:max] = [max_diff, accum_diff]
    end

    if accum_diff < diffs[:accum][1]
      coords[:accum] = [x1, y1, x2, y2]
      diffs[:accum] = [max_diff, accum_diff]
    end
  end

  { coords: coords, diffs: diffs, type: type, n: n }
end

main
